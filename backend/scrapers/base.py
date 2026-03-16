"""Shared utilities for all scrapers."""
import re
import uuid
from datetime import datetime, timezone


def new_record(source: str, **fields) -> dict:
    """Build a base people_records document."""
    return {
        "recordId": str(uuid.uuid4()),
        "source": source,
        "firstName": fields.get("firstName", ""),
        "lastName": fields.get("lastName", ""),
        "middleName": fields.get("middleName", ""),
        "age": fields.get("age"),
        "dateOfBirth": fields.get("dateOfBirth", ""),
        "gender": fields.get("gender", ""),
        "state": fields.get("state", ""),
        "addresses": fields.get("addresses", []),
        "phones": fields.get("phones", []),
        "emails": fields.get("emails", []),
        "relatives": fields.get("relatives", []),
        "occupation": fields.get("occupation", ""),
        "employer": fields.get("employer", ""),
        "sourceData": fields.get("sourceData", {}),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }


def addr_doc(street="", city="", state="", zip_code="", current=True) -> dict:
    return {"street": street, "city": city, "state": state, "zip": zip_code, "current": current}


def clean_phone(raw: str) -> str:
    return re.sub(r"[^\d]", "", raw or "")


def split_name(full: str) -> tuple[str, str, str]:
    """Split 'First [Middle] Last' → (first, middle, last). Best-effort."""
    parts = full.strip().split()
    if len(parts) == 0:
        return "", "", ""
    if len(parts) == 1:
        return parts[0], "", ""
    if len(parts) == 2:
        return parts[0], "", parts[1]
    return parts[0], " ".join(parts[1:-1]), parts[-1]
