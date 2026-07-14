import re
from collections import defaultdict

PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("IP", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
    ("MAC", re.compile(r"\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b")),
    ("PHONE", re.compile(r"(?<!\d)(?:\+?90\s*)?0?5\d{2}[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)")),
    ("CARD", re.compile(r"(?<!\d)(?:\d[ -]*?){16}(?!\d)")),
    ("NATIONAL_ID", re.compile(r"(?<!\d)[1-9]\d{10}(?!\d)")),
    ("SUBSCRIBER", re.compile(r"(?i)\b(?:abone|subscriber)\s*(?:no|numarası|number)?\s*[:#-]?\s*\d{6,12}\b")),
)


def redact(text: str) -> tuple[str, dict[str, str]]:
    """Redact deterministic PII patterns while keeping placeholders stable."""
    counters: dict[str, int] = defaultdict(int)
    values: dict[tuple[str, str], str] = {}
    mapping: dict[str, str] = {}
    output = text

    for label, pattern in PATTERNS:
        def replace(match: re.Match[str], current_label: str = label) -> str:
            raw = match.group(0)
            key = (current_label, raw.lower())
            if key not in values:
                counters[current_label] += 1
                values[key] = f"[{current_label}_{counters[current_label]}]"
                mapping[values[key]] = raw
            return values[key]

        output = pattern.sub(replace, output)
    return output, mapping
