#!/usr/bin/env python3
"""Export English strings from data-i18n* attributes in index.html."""
from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUT = ROOT / "assets" / "i18n" / "en.json"


def main() -> None:
    soup = BeautifulSoup(INDEX.read_text(encoding="utf-8"), "html.parser")
    strings: dict[str, str] = {}

    for el in soup.find_all(attrs={"data-i18n": True}):
        strings[el["data-i18n"]] = el.get_text()
    for el in soup.find_all(attrs={"data-i18n-html": True}):
        strings[el["data-i18n-html"]] = "".join(str(c) for c in el.contents)
    for el in soup.find_all(attrs={"data-i18n-content": True}):
        strings[el["data-i18n-content"]] = el.get("content", "")
    for el in soup.find_all(attrs={"data-i18n-aria-label": True}):
        key = el["data-i18n-aria-label"]
        if key not in strings:
            strings[key] = el.get("aria-label") or "Language"

    OUT.write_text(json.dumps(strings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(strings)} strings -> {OUT}")


if __name__ == "__main__":
    main()
