"""
NPPES NPI Registry — CMS National Plan & Provider Enumeration System
Free API, no key required. 6M+ healthcare providers with names, addresses, specialties.
Docs: https://npiregistry.cms.hhs.gov/api-page
"""
import asyncio
import logging
import httpx
from scrapers.base import new_record, addr_doc

logger = logging.getLogger(__name__)

NPPES_API = "https://npiregistry.cms.hhs.gov/api/"

US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
    "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
    "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
    "TX","UT","VT","VA","WA","WV","WI","WY","DC",
]


async def _fetch_page(client: httpx.AsyncClient, state: str, skip: int) -> list[dict]:
    try:
        params = {
            "version": "2.1",
            "enumeration_type": "NPI-1",  # Individual providers only
            "state": state,
            "limit": 200,
            "skip": skip,
        }
        r = await client.get(NPPES_API, params=params, timeout=20)
        if r.status_code != 200:
            return []
        data = r.json()
        return data.get("results", []) or []
    except Exception as e:
        logger.debug(f"NPPES {state} skip={skip}: {e}")
        return []


def _parse_provider(raw: dict) -> dict | None:
    basic = raw.get("basic") or {}
    first = basic.get("first_name", "")
    last = basic.get("last_name", "")
    middle = basic.get("middle_name", "")
    if not first or not last:
        return None

    # Pick practice location address, fallback to mailing
    addresses = raw.get("addresses", [])
    practice = next((a for a in addresses if a.get("address_purpose") == "LOCATION"), None)
    mailing = next((a for a in addresses if a.get("address_purpose") == "MAILING"), None)
    addr_raw = practice or mailing or {}

    phone_raw = addr_raw.get("telephone_number", "")
    phones = [phone_raw] if phone_raw else []

    taxonomy = raw.get("taxonomies", [{}])
    occupation = taxonomy[0].get("desc", "") if taxonomy else ""

    addr = addr_doc(
        street=addr_raw.get("address_1", ""),
        city=addr_raw.get("city", ""),
        state=addr_raw.get("state", ""),
        zip_code=addr_raw.get("postal_code", "")[:5],
        current=True,
    )

    return new_record(
        "nppes",
        firstName=first,
        lastName=last,
        middleName=middle,
        state=addr_raw.get("state", ""),
        addresses=[addr] if addr["street"] else [],
        phones=phones,
        occupation=occupation,
        sourceData={
            "npi": raw.get("number", ""),
            "taxonomyCode": taxonomy[0].get("code", "") if taxonomy else "",
            "credential": basic.get("credential", ""),
        },
    )


async def scrape(collection) -> tuple[int, int, list]:
    """Scrape NPPES for all individual providers, paginating per state."""
    added = 0
    updated = 0
    errors = []

    async with httpx.AsyncClient() as client:
        for state in US_STATES:
            skip = 0
            state_count = 0

            while True:
                records = await _fetch_page(client, state, skip)
                if not records:
                    break

                for raw in records:
                    try:
                        doc = _parse_provider(raw)
                        if not doc:
                            continue

                        npi = doc["sourceData"].get("npi")
                        if npi:
                            existing = await collection.find_one({"sourceData.npi": npi})
                        else:
                            existing = None

                        if existing:
                            await collection.update_one(
                                {"_id": existing["_id"]},
                                {"$set": {"lastUpdated": doc["lastUpdated"]}},
                            )
                            updated += 1
                        else:
                            await collection.insert_one(doc)
                            added += 1
                            state_count += 1
                    except Exception as e:
                        errors.append(str(e))

                if len(records) < 200:
                    break  # Last page
                skip += 200

                # Throttle to avoid hitting rate limits
                await asyncio.sleep(0.2)

            logger.info(f"NPPES {state}: {state_count} new records")

    logger.info(f"NPPES scrape complete: {added} added, {updated} updated, {len(errors)} errors")
    return added, updated, errors
