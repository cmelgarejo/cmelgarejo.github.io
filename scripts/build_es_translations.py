#!/usr/bin/env python3
"""Build Spanish translations from en.json with resume + rate-limit safety."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from deep_translator import MyMemoryTranslator

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "assets" / "i18n" / "en.json"
ES = ROOT / "assets" / "i18n" / "es.json"
HTML_OVERRIDES = ROOT / "assets" / "i18n" / "es_html_overrides.json"

GLOSSARY = {
    "Tech stack:": "Stack tecnológico:",
    "Project:": "Proyecto:",
    "Home": "Inicio",
    "Experience": "Experiencia",
    "Education": "Educación",
    "Projects": "Proyectos",
    "Writing": "Escritos",
    "Certificates": "Certificados",
    "Introduction": "Introducción",
    "Projects & Open Source": "Proyectos y código abierto",
    "Work Experience": "Experiencia laboral",
    "Skip to main content": "Saltar al contenido principal",
    "Toggle navigation": "Alternar navegación",
    "Language": "Idioma",
    "View CV": "Ver CV",
    "Start a conversation": "Iniciar una conversación",
    "Senior Software Developer": "Desarrollador de software senior",
    "Consultant roles": "Roles de consultoría",
    "Languages": "Idiomas",
    "English — Advanced": "Inglés — Avanzado",
    "Spanish — Native": "Español — Nativo",
    "Portuguese — Basic": "Portugués — Básico",
    "Technologies I enjoy working with:": "Tecnologías con las que disfruto trabajar:",
    "Current": "Actual",
    "Remote": "Remoto",
    "Open source": "Código abierto",
    "And many more projects!": "¡Y muchos proyectos más!",
}


def is_html(value: str) -> bool:
    return "<" in value and ">" in value


def translate_one(translator: MyMemoryTranslator, text: str) -> str:
    if text in GLOSSARY:
        return GLOSSARY[text]
    for attempt in range(6):
        try:
            return translator.translate(text)
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return text


def translate_html(text: str, translator: MyMemoryTranslator) -> str:
    parts = re.split(r"(<[^>]+>)", text)
    out = []
    for part in parts:
        if not part or part.startswith("<"):
            out.append(part)
            continue
        stripped = part.strip()
        if not stripped:
            out.append(part)
            continue
        leading = part[: len(part) - len(part.lstrip())]
        trailing = part[len(part.rstrip()) :]
        translated = translate_one(translator, stripped)
        out.append(f"{leading}{translated}{trailing}")
        time.sleep(0.4)
    return "".join(out)


def save(es: dict[str, str]) -> None:
    ES.write_text(json.dumps(es, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    en: dict[str, str] = json.loads(EN.read_text(encoding="utf-8"))
    es: dict[str, str] = {}
    if ES.exists():
        es = json.loads(ES.read_text(encoding="utf-8"))

    overrides: dict[str, str] = {}
    if HTML_OVERRIDES.exists():
        overrides = json.loads(HTML_OVERRIDES.read_text(encoding="utf-8"))

    translator = MyMemoryTranslator(source="en-GB", target="es-ES")

    for key, value in en.items():
        if key in es and es[key]:
            continue
        if key in overrides:
            es[key] = overrides[key]
            save(es)
            continue
        if value in GLOSSARY:
            es[key] = GLOSSARY[value]
            save(es)
            continue
        if is_html(value):
            es[key] = translate_html(value, translator)
        else:
            es[key] = translate_one(translator, value)
            time.sleep(0.35)
        save(es)

    es.setdefault("nav.language", "Idioma")
    save(es)
    print(f"Wrote {len(es)} Spanish strings -> {ES}")


if __name__ == "__main__":
    main()
