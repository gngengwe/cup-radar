#!/usr/bin/env python3
"""
Generate a structured World Cup squads feed from FIFA's official squad-list PDF.

Outputs:
  - src/data/world-cup-squads.json
  - syncs PDF page references in:
      - src/data/world-cup-sources.json
      - src/data/world-cup-availability.json

Usage:
  python scripts/refresh/squads.py

Requires:
  python -m pip install pypdf
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import date, datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.request import urlopen

try:
    from pypdf import PdfReader
except ImportError as exc:  # pragma: no cover - operator guidance
    raise SystemExit("Missing dependency: pypdf. Install with `python -m pip install pypdf`.") from exc


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "src" / "data"
SOURCES_PATH = DATA_DIR / "world-cup-sources.json"
AVAILABILITY_PATH = DATA_DIR / "world-cup-availability.json"
GROUPS_PATH = DATA_DIR / "groups.json"
SQUADS_PATH = DATA_DIR / "world-cup-squads.json"

POSITION_MAP = {
    "GK": "Goalkeeper",
    "DF": "Defender",
    "MF": "Midfielder",
    "FW": "Forward",
}
DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}$")
TITLE_RE = re.compile(r"^(?P<name>.+?) \((?P<code>[A-Z]{3})\)$")


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def clean_text(value: str) -> str:
    return " ".join(value.replace("\x00", "").replace("\xa0", " ").split())


def is_upperish(token: str) -> bool:
    letters = "".join(ch for ch in token if ch.isalpha())
    return bool(letters) and letters.upper() == letters


def title_piece(value: str) -> str:
    return "-".join(part.title() for part in value.split("-"))


def title_name(value: str) -> str:
    return " ".join(title_piece(part) for part in value.split())


def listing_to_display(listing_name: str) -> str:
    tokens = clean_text(listing_name).split()
    idx = next((i for i, token in enumerate(tokens) if not is_upperish(token)), None)
    if idx is None or idx == 0:
        return title_name(listing_name)

    surname = " ".join(title_piece(token) for token in tokens[:idx])
    given_names = " ".join(tokens[idx:])
    return f"{given_names} {surname}".strip()


def extract_team_header(page) -> tuple[str, str]:
    lines = [clean_text(line) for line in page.extract_text().splitlines() if clean_text(line)]
    if not lines:
        raise ValueError("Unable to extract any text from PDF page.")

    match = TITLE_RE.match(lines[0])
    if not match:
        raise ValueError(f"Unable to parse team header from line: {lines[0]!r}")

    return match.group("name"), match.group("code")


def extract_players(page) -> list[dict]:
    items: list[tuple[int, float, str]] = []

    def visitor(text, _cm, tm, _font_dict, _font_size):
        value = clean_text(text)
        if not value:
            return
        items.append((int(round(tm[5])), round(tm[4], 1), value))

    page.extract_text(visitor_text=visitor)

    rows: dict[int, list[tuple[float, str]]] = {}
    for y, x, value in items:
        if x == 0:
            continue
        rows.setdefault(y, []).append((x, value))

    players: list[dict] = []
    for y in sorted(rows.keys(), reverse=True):
        cols = sorted(rows[y], key=lambda item: item[0])
        squad_number = next((value for x, value in cols if x < 30 and value.isdigit()), None)
        position_code = next((value for x, value in cols if 30 <= x < 50 and value in POSITION_MAP), None)
        if not squad_number or not position_code:
            continue

        listing_name = next((value for x, value in cols if 50 <= x < 180), "")
        first_names = next((value for x, value in cols if 180 <= x < 315), "")
        last_names = next((value for x, value in cols if 315 <= x < 420), "")
        shirt_name = next((value for x, value in cols if 420 <= x < 530), "")
        dob = next((value for x, value in cols if 520 <= x < 585 and DATE_RE.match(value)), "")
        club_parts = [value for x, value in cols if 585 <= x < 690 and not value.isdigit()]
        height_value = next((value for x, value in cols if x >= 690 and value.isdigit()), "")

        display_name = (
            f"{first_names} {title_name(last_names)}".strip()
            if first_names and last_names
            else listing_to_display(listing_name)
        )

        players.append(
            {
                "number": int(squad_number),
                "positionCode": position_code,
                "position": POSITION_MAP[position_code],
                "listingName": listing_name,
                "displayName": display_name,
                "shirtName": shirt_name or None,
                "dateOfBirth": dob or None,
                "club": " ".join(club_parts) or None,
                "heightCm": int(height_value) if height_value else None,
            }
        )

    players.sort(key=lambda player: player["number"])
    return players


def build_groups_index(groups_data: dict) -> dict[str, dict]:
    team_index: dict[str, dict] = {}
    for group in groups_data["groups"]:
        for team in group["teams"]:
            team_index[team["code"]] = {
                "name": team["name"],
                "flag": team["flag"],
                "group": group["id"],
            }
    return team_index


def main() -> None:
    sources_data = read_json(SOURCES_PATH)
    availability_data = read_json(AVAILABILITY_PATH)
    groups_data = read_json(GROUPS_PATH)
    groups_index = build_groups_index(groups_data)

    squads_url = sources_data["globalSources"]["squads"]["url"]
    with urlopen(squads_url) as response:
        pdf_data = response.read()

    reader = PdfReader(BytesIO(pdf_data))
    teams: list[dict] = []
    page_map: dict[str, int] = {}

    for page_index, page in enumerate(reader.pages, start=1):
        pdf_name, code = extract_team_header(page)
        if code not in groups_index:
            raise ValueError(f"Unexpected team code from PDF page {page_index}: {code}")

        players = extract_players(page)
        if len(players) != 26:
            raise ValueError(f"Expected 26 players for {code} on page {page_index}, found {len(players)}.")

        position_counts = Counter(player["positionCode"] for player in players)
        page_map[code] = page_index

        teams.append(
            {
                "page": page_index,
                "code": code,
                "name": groups_index[code]["name"],
                "pdfName": pdf_name,
                "group": groups_index[code]["group"],
                "flag": groups_index[code]["flag"],
                "playerCount": len(players),
                "positionCounts": {
                    "GK": position_counts.get("GK", 0),
                    "DF": position_counts.get("DF", 0),
                    "MF": position_counts.get("MF", 0),
                    "FW": position_counts.get("FW", 0),
                },
                "players": players,
            }
        )

    expected_codes = set(groups_index.keys())
    actual_codes = {team["code"] for team in teams}
    if actual_codes != expected_codes:
        missing = sorted(expected_codes - actual_codes)
        extra = sorted(actual_codes - expected_codes)
        raise ValueError(f"Team-code mismatch. Missing={missing} Extra={extra}")

    today = date.today().isoformat()
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    squads_payload = {
        "_note": "Generated from FIFA's official World Cup 2026 squad-list PDF. Use this as the structured player-and-position feed, then overlay late availability notes from world-cup-availability.json.",
        "lastVerified": today,
        "generatedAt": generated_at,
        "source": {
            "title": sources_data["globalSources"]["squads"]["title"],
            "publisher": sources_data["globalSources"]["squads"]["publisher"],
            "publishedAt": sources_data["globalSources"]["squads"].get("publishedAt"),
            "url": squads_url,
        },
        "totals": {
            "teams": len(teams),
            "players": sum(team["playerCount"] for team in teams),
        },
        "teams": teams,
    }

    sources_data["lastVerified"] = today
    sources_data.setdefault("localFeeds", {})
    sources_data["localFeeds"]["squads"] = {
        "path": "src/data/world-cup-squads.json",
        "status": "generated",
        "recordsPresent": sum(team["playerCount"] for team in teams),
        "officialTournamentTeamCount": len(teams),
    }
    sources_data["fifaSquadPdfPages"] = [
        {
            "page": team["page"],
            "code": team["code"],
            "name": team["name"],
            "group": team["group"],
        }
        for team in teams
    ]

    for team_entry in availability_data.get("teams", []):
        code = team_entry.get("code")
        if code in page_map:
            team_entry["fifaSquadPdfPage"] = page_map[code]

    write_json(SQUADS_PATH, squads_payload)
    write_json(SOURCES_PATH, sources_data)
    write_json(AVAILABILITY_PATH, availability_data)

    print(f"[squads] wrote {SQUADS_PATH.relative_to(ROOT)}")
    print(f"[squads] teams={len(teams)} players={sum(team['playerCount'] for team in teams)}")
    print(f"[squads] synced page map in {SOURCES_PATH.name} and {AVAILABILITY_PATH.name}")


if __name__ == "__main__":
    main()
