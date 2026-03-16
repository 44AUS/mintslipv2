"""
Scraper orchestrator — maps source name → scraper module.
Each scraper module must expose an async `scrape(collection)` coroutine
that returns (added: int, updated: int, errors: list[str]).
"""
from scrapers.nsopw import scrape as scrape_nsopw
from scrapers.nppes import scrape as scrape_nppes
from scrapers.fec   import scrape as scrape_fec
from scrapers.faa   import scrape as scrape_faa
from scrapers.ssdi  import scrape as scrape_ssdi

_SCRAPERS = {
    "nsopw": scrape_nsopw,
    "nppes": scrape_nppes,
    "fec":   scrape_fec,
    "faa":   scrape_faa,
    "ssdi":  scrape_ssdi,
}


async def run_scraper(source: str, collection) -> tuple:
    fn = _SCRAPERS.get(source)
    if fn is None:
        raise ValueError(f"No scraper registered for source '{source}'")
    return await fn(collection)
