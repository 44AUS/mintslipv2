"""
FEC Campaign Finance — Federal Election Commission open data
Free API, DEMO_KEY allows 1000 req/day. Register for a free key at api.data.gov for higher limits.
Endpoint: /schedules/schedule_a/ — individual campaign contributions with donor name + address.
Docs: https://api.open.fec.gov/developers/
"""
import asyncio
import logging
import httpx
from scrapers.base import new_record, addr_doc, split_name

logger = logging.getLogger(__name__)

FEC_BASE = "https://api.open.fec.gov/v1"
FEC_API_KEY = "DEMO_KEY"  # Replace with a free key from https://api.data.gov/signup/

US_STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
    "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
    "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
    "TX","UT","VT","VA","WA","WV","WI","WY","DC",
]

RECENT_CYCLE = 2024  # 2-year election cycle


async def _fetch_contributors(client: httpx.AsyncClient, state: str, page: int) -> dict:
    try:
        params = {
            "api_key": FEC_API_KEY,
            "contributor_state": state,
            "two_year_transaction_period": RECENT_CYCLE,
            "per_page": 100,
            "page": page,
            "sort": "contribution_receipt_date",
            "sort_null_only": False,
        }
        r = await client.get(f"{FEC_BASE}/schedules/schedule_a/", params=params, timeout=20)
        if r.status_code == 429:
            await asyncio.sleep(5)
            return {}
        if r.status_code != 200:
            return {}
        return r.json()
    except Exception as e:
        logger.debug(f"FEC {state} page={page}: {e}")
        return {}


def _parse_contribution(raw: dict) -> dict | None:
    name_raw = raw.get("contributor_name", "")
    if not name_raw:
        return None

    # FEC name format is usually "LAST, FIRST MIDDLE"
    if "," in name_raw:
        parts = name_raw.split(",", 1)
        last = parts[0].strip().title()
        rest = parts[1].strip()
        rest_parts = rest.split()
        first = rest_parts[0].title() if rest_parts else ""
        middle = " ".join(rest_parts[1:]).title() if len(rest_parts) > 1 else ""
    else:
        first, middle, last = split_name(name_raw.title())

    if not first or not last:
        return None

    addr = addr_doc(
        street=raw.get("contributor_street_1", ""),
        city=(raw.get("contributor_city", "") or "").title(),
        state=raw.get("contributor_state", ""),
        zip_code=(raw.get("contributor_zip", "") or "")[:5],
        current=True,
    )

    return new_record(
        "fec",
        firstName=first,
        lastName=last,
        middleName=middle,
        state=raw.get("contributor_state", ""),
        addresses=[addr] if addr["street"] else [],
        occupation=(raw.get("contributor_occupation", "") or "").title(),
        employer=(raw.get("contributor_employer", "") or "").title(),
        sourceData={
            "committee": raw.get("committee", {}).get("name", ""),
            "amount": raw.get("contribution_receipt_amount"),
            "date": raw.get("contribution_receipt_date", ""),
            "cycle": RECENT_CYCLE,
        },
    )


async def scrape(collection) -> tuple[int, int, list]:
    """Scrape FEC individual contributions for all states."""
    added = 0
    updated = 0
    errors = []

    async with httpx.AsyncClient() as client:
        for state in US_STATES:
            page = 1
            state_count = 0
            max_pages = 10  # Limit per state per run to avoid DEMO_KEY rate limits

            while page <= max_pages:
                data = await _fetch_contributors(client, state, page)
                results = data.get("results", [])
                if not results:
                    break

                for raw in results:
                    try:
                        doc = _parse_contribution(raw)
                        if not doc:
                            continue

                        # Deduplicate by name + state + zip
                        existing = await collection.find_one({
                            "source": "fec",
                            "firstName": doc["firstName"],
                            "lastName": doc["lastName"],
                            "state": doc["state"],
                            "addresses.zip": doc["addresses"][0]["zip"] if doc["addresses"] else "",
                        })
                        if existing:
                            updated += 1
                        else:
                            await collection.insert_one(doc)
                            added += 1
                            state_count += 1
                    except Exception as e:
                        errors.append(str(e))

                pagination = data.get("pagination", {})
                if page >= pagination.get("pages", 1):
                    break
                page += 1
                await asyncio.sleep(0.3)

            logger.info(f"FEC {state}: {state_count} new records")

    logger.info(f"FEC scrape complete: {added} added, {updated} updated, {len(errors)} errors")
    return added, updated, errors
