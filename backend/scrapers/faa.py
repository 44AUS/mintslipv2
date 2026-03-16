"""
FAA Airmen Registry — bulk download from FAA
Downloads the ReleasableAirmen ZIP (~50MB), parses CSV, stores pilot records.
Source: https://registry.faa.gov/database/ReleasableAirmen.zip
Contains: ~900,000 certified pilots with names, addresses, certificate types.
"""
import asyncio
import csv
import io
import logging
import zipfile
import httpx
from scrapers.base import new_record, addr_doc

logger = logging.getLogger(__name__)

FAA_AIRMEN_URL = "https://registry.faa.gov/database/ReleasableAirmen.zip"
TARGET_FILE = "PILOT_BASIC.csv"  # Main file in the ZIP


async def _download_zip() -> bytes:
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        r = await client.get(FAA_AIRMEN_URL)
        r.raise_for_status()
        return r.content


def _parse_csv(zip_bytes: bytes) -> list[dict]:
    records = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        # List available files for debugging
        names = zf.namelist()
        logger.info(f"FAA ZIP contents: {names}")

        # Find the pilot basic file (name may vary slightly)
        target = next(
            (n for n in names if "PILOT_BASIC" in n.upper() or "AIRMEN_BASIC" in n.upper()),
            None,
        )
        if not target:
            # Try any CSV
            target = next((n for n in names if n.upper().endswith(".csv")), None)
        if not target:
            raise ValueError(f"Could not find pilot CSV in FAA ZIP. Files: {names}")

        with zf.open(target) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"))
            for row in reader:
                records.append(dict(row))

    return records


def _parse_pilot(row: dict) -> dict | None:
    first = (row.get("FIRST_NAME", "") or "").strip().title()
    last  = (row.get("LAST_NAME",  "") or "").strip().title()
    middle = (row.get("MED_EXP_DATE", "") or "").strip()  # middle initial sometimes here
    if not first or not last:
        return None

    city  = (row.get("CITY",  "") or "").strip().title()
    state = (row.get("STATE", "") or "").strip().upper()
    zip_c = (row.get("ZIP_CODE", "") or "").strip()[:5]
    country = (row.get("COUNTRY", "") or "").strip()

    # Only include US records
    if country and country.upper() not in ("US", "USA", "UNITED STATES", ""):
        return None

    cert_type = (row.get("CERTIFICATE", "") or row.get("CERT_TYPE_VALUE", "") or "").strip()

    addr = addr_doc(city=city, state=state, zip_code=zip_c, current=True)

    return new_record(
        "faa",
        firstName=first,
        lastName=last,
        state=state,
        addresses=[addr] if city or state else [],
        occupation=f"Pilot ({cert_type})" if cert_type else "Pilot",
        sourceData={
            "certificateType": cert_type,
            "uniqueId": row.get("UNIQUE_ID", "") or row.get("MED_CLASS", ""),
        },
    )


async def scrape(collection) -> tuple[int, int, list]:
    """Download FAA airmen bulk data and upsert into people_records."""
    added = 0
    updated = 0
    errors = []

    logger.info("FAA: Downloading airmen bulk data (~50MB)…")
    try:
        zip_bytes = await _download_zip()
    except Exception as e:
        return 0, 0, [f"FAA download failed: {e}"]

    logger.info("FAA: Parsing CSV…")
    try:
        rows = await asyncio.to_thread(_parse_csv, zip_bytes)
    except Exception as e:
        return 0, 0, [f"FAA parse failed: {e}"]

    logger.info(f"FAA: Processing {len(rows)} pilot records…")

    batch = []
    BATCH_SIZE = 500

    for row in rows:
        try:
            doc = _parse_pilot(row)
            if not doc:
                continue

            unique_id = doc["sourceData"].get("uniqueId")
            if unique_id:
                existing = await collection.find_one({"source": "faa", "sourceData.uniqueId": unique_id})
                if existing:
                    updated += 1
                    continue

            batch.append(doc)
            if len(batch) >= BATCH_SIZE:
                await collection.insert_many(batch, ordered=False)
                added += len(batch)
                batch = []
                await asyncio.sleep(0)  # yield to event loop
        except Exception as e:
            errors.append(str(e))

    if batch:
        await collection.insert_many(batch, ordered=False)
        added += len(batch)

    logger.info(f"FAA scrape complete: {added} added, {updated} updated, {len(errors)} errors")
    return added, updated, errors
