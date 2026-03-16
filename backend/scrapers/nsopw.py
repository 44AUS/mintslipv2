"""
NSOPW — National Sex Offender Public Website
Free government REST API. No API key required.
Docs: https://www.nsopw.gov/en/Registry/SearchAPI
"""
from __future__ import annotations
import asyncio
import logging
import httpx
from scrapers.base import new_record, addr_doc, split_name

logger = logging.getLogger(__name__)

NSOPW_BASE = "https://www.nsopw.gov/api/search/jurisdictions"

# All US state + territory jurisdiction codes
JURISDICTIONS = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
    "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
    "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
    "TX","UT","VT","VA","WA","WV","WI","WY","DC","GU","PR","VI",
]

# Common first names to search (NSOPW requires at least a first name)
SAMPLE_FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard",
    "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew",
    "Anthony", "Mark", "Donald", "Steven", "Andrew", "Kenneth", "George",
    "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Susan", "Jessica",
    "Sarah", "Karen", "Lisa",
]


async def _fetch_jurisdiction(client: httpx.AsyncClient, jurisdiction: str, first: str) -> list[dict]:
    try:
        url = f"{NSOPW_BASE}/{jurisdiction}/results"
        r = await client.get(url, params={"firstName": first}, timeout=15)
        if r.status_code != 200:
            return []
        data = r.json()
        return data.get("Persons", []) or []
    except Exception as e:
        logger.debug(f"NSOPW {jurisdiction}/{first}: {e}")
        return []


def _parse_person(raw: dict, jurisdiction: str) -> dict:
    first, middle, last = split_name(raw.get("FullName") or "")
    if not first and not last:
        first = raw.get("FirstName", "")
        last = raw.get("LastName", "")
        middle = raw.get("MiddleName", "")

    addr_raw = raw.get("PhysicalAddress") or {}
    address = addr_doc(
        street=addr_raw.get("Street", ""),
        city=addr_raw.get("City", ""),
        state=addr_raw.get("State", jurisdiction),
        zip_code=addr_raw.get("Zip", ""),
        current=True,
    )

    return new_record(
        "nsopw",
        firstName=first,
        lastName=last,
        middleName=middle,
        state=jurisdiction,
        addresses=[address] if any(address.values()) else [],
        sourceData={
            "offenseDescription": raw.get("OffenseDescription", ""),
            "registrationDate": raw.get("RegistrationDate", ""),
            "jurisdiction": jurisdiction,
        },
    )


async def scrape(collection) -> tuple:
    """Scrape NSOPW for records across all jurisdictions."""
    added = 0
    updated = 0
    errors = []

    async with httpx.AsyncClient() as client:
        for first_name in SAMPLE_FIRST_NAMES:
            tasks = [_fetch_jurisdiction(client, j, first_name) for j in JURISDICTIONS]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for jurisdiction, result in zip(JURISDICTIONS, results):
                if isinstance(result, Exception):
                    errors.append(f"{jurisdiction}/{first_name}: {result}")
                    continue

                for raw_person in result:
                    try:
                        doc = _parse_person(raw_person, jurisdiction)
                        if not doc["firstName"] and not doc["lastName"]:
                            continue

                        existing = await collection.find_one({
                            "source": "nsopw",
                            "firstName": doc["firstName"],
                            "lastName": doc["lastName"],
                            "state": doc["state"],
                        })
                        if existing:
                            await collection.update_one(
                                {"_id": existing["_id"]},
                                {"$set": {"lastUpdated": doc["lastUpdated"], "sourceData": doc["sourceData"]}},
                            )
                            updated += 1
                        else:
                            await collection.insert_one(doc)
                            added += 1
                    except Exception as e:
                        errors.append(str(e))

            # Small delay between name batches to be respectful
            await asyncio.sleep(0.5)

    logger.info(f"NSOPW scrape complete: {added} added, {updated} updated, {len(errors)} errors")
    return added, updated, errors
