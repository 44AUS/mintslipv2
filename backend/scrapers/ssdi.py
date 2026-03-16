"""
SSDI — Social Security Death Index
Free bulk download from the FamilySearch bulk data program.
Source: https://efts.familysearch.org/records/search?q.collectionId=1202535

Alternative bulk source (public domain): The SSDI is distributed via genealogy sites.
This scraper uses the FamilySearch open API (no key required for basic access).

Data includes: first name, last name, DOB, DOD, last known ZIP code.
~98 million records of deceased individuals.
"""
from __future__ import annotations
import asyncio
import csv
import io
import logging
import os
import zipfile
import httpx
from scrapers.base import new_record, addr_doc

logger = logging.getLogger(__name__)

# FamilySearch API endpoint — paginates through SSDI collection
FS_API = "https://familysearch.org/platform/records/search"
FS_COLLECTION = "1202535"  # SSDI collection ID

# Alternative: direct CSV downloads from public SSDI mirrors
# The SSDI is public domain data; many genealogy sites mirror it as CSV
SSDI_CSV_SOURCES = [
    # Primary: Steve Morse's SSDI (one of the largest mirrors)
    "https://raw.githubusercontent.com/hleecaster/ssdi-data/main/ssdi_sample.csv",
]

# States where SSDI last-residence ZIP codes are tracked
# We'll use ZIP → state mapping for the address field


async def _fetch_page(client: httpx.AsyncClient, start: int) -> list:
    """Fetch one page of SSDI records from FamilySearch."""
    try:
        headers = {"Accept": "application/x-gedcomx-v1+json"}
        params = {
            "count": 100,
            "start": start,
            "q.collectionId": FS_COLLECTION,
        }
        r = await client.get(FS_API, params=params, headers=headers, timeout=20)
        if r.status_code != 200:
            return []
        data = r.json()
        entries = data.get("entries", []) or []
        return entries
    except Exception as e:
        logger.debug(f"SSDI page {start}: {e}")
        return []


def _parse_fs_entry(entry: dict) -> dict | None:
    """Parse a FamilySearch SSDI entry into a people_records document."""
    persons = entry.get("content", {}).get("gedcomx", {}).get("persons", [])
    if not persons:
        return None
    person = persons[0]

    # Name
    names = person.get("names", [])
    first, last = "", ""
    for name in names:
        parts = name.get("nameForms", [{}])
        full = parts[0].get("fullText", "") if parts else ""
        if full and " " in full:
            first, last = full.split(" ", 1)
            break

    if not first or not last:
        return None

    # Facts (birth, death, residence)
    facts = person.get("facts", [])
    dob, dod, zip_code = "", "", ""
    for fact in facts:
        ftype = fact.get("type", "")
        if "Birth" in ftype:
            dob = fact.get("date", {}).get("original", "")
        elif "Death" in ftype:
            dod = fact.get("date", {}).get("original", "")
        elif "Residence" in ftype or "LastResidence" in ftype:
            place = fact.get("place", {}).get("original", "") or ""
            # ZIP is often embedded in place string
            import re
            m = re.search(r"\b(\d{5})\b", place)
            if m:
                zip_code = m.group(1)

    addr = addr_doc(zip_code=zip_code, current=False) if zip_code else {}

    return new_record(
        "ssdi",
        firstName=first.strip().title(),
        lastName=last.strip().title(),
        dateOfBirth=dob,
        addresses=[addr] if addr else [],
        sourceData={
            "dateOfDeath": dod,
            "lastResidenceZip": zip_code,
            "fsId": entry.get("id", ""),
        },
    )


async def _scrape_via_familysearch(collection, token: str) -> tuple:
    """Scrape SSDI from FamilySearch API using a bearer token."""
    added, updated, errors = 0, 0, []
    MAX_RECORDS = 50000

    async with httpx.AsyncClient() as client:
        start = 0
        while added + updated < MAX_RECORDS:
            try:
                headers = {
                    "Accept": "application/x-gedcomx-v1+json",
                    "Authorization": f"Bearer {token}",
                }
                params = {"count": 100, "start": start, "q.collectionId": FS_COLLECTION}
                r = await client.get(FS_API, params=params, headers=headers, timeout=20)
                if r.status_code == 401:
                    errors.append("FamilySearch token is invalid or expired")
                    break
                if r.status_code != 200:
                    errors.append(f"FamilySearch returned {r.status_code}")
                    break
                entries = r.json().get("entries", []) or []
            except Exception as e:
                errors.append(str(e))
                break

            if not entries:
                break

            for entry in entries:
                try:
                    doc = _parse_fs_entry(entry)
                    if not doc:
                        continue
                    fs_id = doc["sourceData"].get("fsId")
                    if fs_id:
                        existing = await collection.find_one(
                            {"source": "ssdi", "sourceData.fsId": fs_id},
                            projection={"_id": 1},
                        )
                        if existing:
                            updated += 1
                            continue
                    await collection.insert_one(doc)
                    added += 1
                except Exception as e:
                    errors.append(str(e))

            start += 100
            if len(entries) < 100:
                break
            await asyncio.sleep(0.5)

    return added, updated, errors


async def scrape(collection) -> tuple:
    """Scrape SSDI records.

    Requires FAMILYSEARCH_TOKEN env var (OAuth2 bearer token from FamilySearch).
    To get a token: sign up at familysearch.org, create an app, use client credentials flow.
    """
    token = os.environ.get("FAMILYSEARCH_TOKEN", "")
    if not token:
        msg = (
            "SSDI scraper requires a FamilySearch bearer token. "
            "Set the FAMILYSEARCH_TOKEN environment variable. "
            "Get a token at https://www.familysearch.org/developers/"
        )
        logger.error(msg)
        return 0, 0, [msg]

    added, updated, errors = await _scrape_via_familysearch(collection, token)
    logger.info(f"SSDI scrape complete: {added:,} added, {updated:,} updated, {len(errors)} errors")
    return added, updated, errors
