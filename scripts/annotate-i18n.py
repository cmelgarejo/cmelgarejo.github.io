#!/usr/bin/env python3
"""Add data-i18n / data-i18n-html attributes and export English strings."""
from __future__ import annotations

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
OUT_EN = ROOT / "assets" / "i18n" / "en.json"

SKIP_PARENT_TAGS = {"script", "style", "svg", "codersrank-widget"}
TEXT_TAGS = {"h1", "h2", "h3", "p", "li", "small", "a", "span", "strong", "button"}
HTML_TAGS = {"p", "li", "a"}


def has_meaningful_text(el) -> bool:
    text = el.get_text(strip=True)
    return len(text) >= 2


def contains_nested_block(el, tag_name: str) -> bool:
    for child in el.find_all(TEXT_TAGS, recursive=True):
        if child.name == tag_name and child is not el:
            return True
    return False


def should_skip(el) -> bool:
    for parent in el.parents:
        if parent.name in SKIP_PARENT_TAGS:
            return True
    if el.get("class") and "social-icon" in el.get("class", []):
        return True
    if el.name == "a" and el.get("href", "").startswith("http"):
        # Keep nav/hero buttons; skip social icons handled above
        if not el.get("data-i18n-nav"):
            if el.find_parent("nav") and el.get("href", "").startswith("#"):
                return False
            if el.get("class") and "button" in el.get("class", []):
                return False
            if el.find_parent(class_="hero-actions"):
                return False
            if el.find_parent(id="projects") or el.find_parent(id="experience"):
                # Allow in-content project links when paragraph is translated as HTML
                return True
    if el.name == "small" and el.find_parent("h3") and el.find_previous_sibling():
        pass
    return False


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    strings: dict[str, str] = {}
    counter = 0

    def next_key(prefix: str) -> str:
        nonlocal counter
        key = f"{prefix}.{counter}"
        counter += 1
        return key

    # Meta and document
    title = soup.find("title")
    if title and title.string:
        key = "meta.title"
        title["data-i18n"] = key
        strings[key] = title.string.strip()

    desc = soup.find("meta", attrs={"name": "description"})
    if desc and desc.get("content"):
        key = "meta.description"
        desc["data-i18n-content"] = key
        strings[key] = desc["content"].strip()

    skip = soup.find("a", class_="skip-link")
    if skip:
        key = "a11y.skip"
        skip["data-i18n"] = key
        strings[key] = skip.get_text(strip=True)

    # Header hero + nav
    hero_h1 = soup.select_one("header .title h1")
    if hero_h1:
        key = "hero.title"
        hero_h1["data-i18n-html"] = key
        strings[key] = "".join(str(c) for c in hero_h1.contents)

    intro_h1 = soup.select_one("#introduction h1")
    if intro_h1:
        key = "intro.title"
        intro_h1["data-i18n-html"] = key
        strings[key] = "".join(str(c) for c in intro_h1.contents)

    lang_group = soup.select_one(".lang-switcher")
    if lang_group:
        lang_group["data-i18n-aria-label"] = "nav.language"
        strings["nav.language"] = "Language"

    for sel, prefix in [
        ("header .title .eyebrow", "hero"),
        ("header .title .hero-summary", "hero"),
        ("header .title .button-primary", "hero"),
        ("header .title .button-secondary", "hero"),
        ("nav ul li a", "nav"),
    ]:
        for el in soup.select(sel):
            if not has_meaningful_text(el):
                continue
            if el.get("data-i18n") or el.get("data-i18n-html"):
                continue
            key = next_key(prefix)
            if el.name in HTML_TAGS and el.find("a"):
                el["data-i18n-html"] = key
                strings[key] = "".join(str(c) for c in el.contents)
            else:
                el["data-i18n"] = key
                strings[key] = el.get_text(strip=True)

    nav_toggle = soup.find("button", class_="nav-toggle")
    if nav_toggle:
        sr = nav_toggle.find(class_="sr-only")
        if sr:
            key = "a11y.toggle_nav"
            sr["data-i18n"] = key
            strings[key] = sr.get_text(strip=True)

    main = soup.find("main", id="main-content")
    if not main:
        raise SystemExit("main-content not found")

    for section in main.find_all("section", recursive=False):
        sid = section.get("id", "section")
        prefix = f"sec.{sid}"

        for h2 in section.select(":scope > .col-full > h2"):
            key = f"{prefix}.heading"
            h2["data-i18n"] = key
            strings[key] = h2.get_text(strip=True)

        for el in section.select(
            ".flex-title h3, .content-left-offset p, .content-left-offset li, "
            ".content-left-offset strong, .col-full > p, .card .content h3, footer p"
        ):
            if should_skip(el):
                continue
            if not has_meaningful_text(el):
                continue
            if el.get("data-i18n") or el.get("data-i18n-html"):
                continue
            if el.name == "h3":
                # Role title only (first text node before small)
                key = next_key(f"{prefix}.job")
                el["data-i18n"] = key
                # Only top-level text in h3 (role), not small children
                role_parts = []
                for child in el.children:
                    if getattr(child, "name", None) == "small":
                        break
                    if isinstance(child, NavigableString):
                        role_parts.append(str(child))
                role = "".join(role_parts).strip()
                strings[key] = role if role else el.get_text(strip=True)
                for sm in el.find_all("small", recursive=False):
                    sk = next_key(f"{prefix}.jobmeta")
                    sm["data-i18n"] = sk
                    strings[sk] = sm.get_text(strip=True)
                continue

            key = next_key(prefix)
            inner_links = el.find_all("a", recursive=True)
            if el.name in HTML_TAGS and inner_links:
                el["data-i18n-html"] = key
                strings[key] = "".join(str(c) for c in el.contents)
            else:
                el["data-i18n"] = key
                strings[key] = el.get_text(strip=True)

        for card in section.select(".card .content h3 small"):
            key = next_key(f"{prefix}.cardmeta")
            card["data-i18n"] = key
            strings[key] = card.get_text(strip=True)

    footer = soup.find("footer")
    if footer:
        fp = footer.find("p")
        if fp and not fp.get("data-i18n-html"):
            key = "footer.icons"
            fp["data-i18n-html"] = key
            strings[key] = "".join(str(c) for c in fp.contents)

    OUT_EN.parent.mkdir(parents=True, exist_ok=True)
    OUT_EN.write_text(json.dumps(strings, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    INDEX.write_text(str(soup), encoding="utf-8")
    print(f"Annotated {len(strings)} strings -> {OUT_EN}")


if __name__ == "__main__":
    main()
