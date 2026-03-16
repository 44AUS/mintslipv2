"""
FAA Airmen Registry — bulk download from FAA
Downloads the ReleasableAirmen ZIP (~50MB), parses CSV, stores pilot records.
Source: https://registry.faa.gov/database/ReleasableAirmen.zip
Contains: ~900,000 certified pilots with names, addresses, certificate types.
"""
from __future__ import annotations
import asyncio
import csv
import io
import logging
import zipfile
import httpx
from scrapers.base import new_record, addr_doc

logger = logging.getLogger(__name__)

FAA_AIRMEN_URL = "https://registry.faa.gov/database/ReleasableAirmen.zip"


async def _download_zip() -> bytes:
    async with httpx.AsyncClient(timeout=180, follow_redirects=True) as client:
        r = await client.get(FAA_AIRMEN_URL)
        r.raise_for_status()
        return r.content


def _normalize_headers(headers: list) -> list:
    """Normalize CSV headers: strip whitespace, uppercase, spaces/dots → underscores."""
    return [h.strip().upper().replace(" ", "_").replace(".", "_").replace("-", "_") for h in headers]


def _parse_csv(zip_bytes: bytes) -> list:
    """Extract and parse the pilot CSV from the ZIP. Returns list of row dicts."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        logger.info(f"FAA ZIP contents: {names}")

        # Priority order: PILOT_BASIC → any *BASIC* → any CSV
        target = (
            next((n for n in names if "PILOT_BASIC" in n.upper()), None)
            or next((n for n in names if "BASIC" in n.upper() and n.upper().endswith(".csv")), None)
            or next((n for n in names if n.upper().endswith(".csv")), None)
        )
        if not target:
            raise ValueError(f"No CSV found in FAA ZIP. Files: {names}")

        logger.info(f"FAA: Using file '{target}'")
        with zf.open(target) as f:
            content = f.read().decode("latin-1")

    # Detect delimiter by counting tabs vs commas in first line
    first_line = content.split("\n")[0]
    delimiter = "\t" if first_line.count("\t") > first_line.count(",") else ","

    reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
    # Normalize column names so we handle spaces, dots, different casing
    if reader.fieldnames:
        reader.fieldnames = _normalize_headers(reader.fieldnames)
        logger.info(f"FAA columns (first 12): {reader.fieldnames[:12]}")

    records = [dict(row) for row in reader]
    logger.info(f"FAA: Parsed {len(records):,} rows from '{target}'")
    return records


def _parse_pilot(row: dict):
    """Parse a raw CSV row into a people_records document, or None if invalid."""
    # Accept multiple column name variants (normalized to uppercase_underscore above)
    def g(*keys):
        for k in keys:
            val = (row.get(k, "") or "").strip()
            if val:
                return val
        return ""

    first = g("FIRST_NAME", "FIRSTNAME", "FIRST").title()
    last  = g("LAST_NAME", "LASTNAME", "LAST").title()
    if not first or not last:
        return None

    city    = g("CITY").title()
    state   = g("STATE").upper()
    zip_c   = g("ZIP_CODE", "ZIP", "ZIPCODE", "ZIP_CD")[:5]
    country = g("COUNTRY", "COUNTRY_CODE").upper()

    # Skip non-US records
    if country and country not in ("US", "USA", "UNITED STATES", ""):
        return None

    unique_id  = g("UNIQUE_ID", "UNIQUE.ID", "ID", "AIRMEN_ID")
    med_class  = g("MED_CLASS", "MED_CLASS_CD", "MEDICAL_CLASS")
    cert_label = f"Medical Class {med_class}" if med_class else "Pilot"

    addr = addr_doc(city=city, state=state, zip_code=zip_c, current=True)

    return new_record(
        "faa",
        firstName=first,
        lastName=last,
        state=state,
        addresses=[addr] if (city or state) else [],
        occupation=cert_label,
        sourceData={
            "uniqueId": unique_id,
            "medClass": med_class,
            "medExpDate": g("MED_EXP_DATE"),
        },
    )


async def scrape(collection) -> tuple:
    """Download FAA airmen bulk data and upsert into people_records."""
    added   = 0
    updated = 0
    errors  = []

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

    logger.info(f"FAA: Processing {len(rows):,} rows…")

    batch     = []
    BATCH_SIZE = 500

    for row in rows:
        try:
            doc = _parse_pilot(row)
            if not doc:
                continue

            unique_id = doc["sourceData"].get("uniqueId")
            if unique_id:
                if await collection.find_one(
                    {"source": "faa", "sourceData.uniqueId": unique_id},
                    projection={"_id": 1},
                ):
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

    logger.info(f"FAA scrape complete: {added:,} added, {updated:,} updated, {len(errors)} errors")
    return added, updated, errors
