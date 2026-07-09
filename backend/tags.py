"""Curated tag list + helpers for normalizing/filtering tags."""

PREDEFINED_TAGS = [
    "geography", "education", "technology", "ai", "nature", "politics",
    "art", "music", "dance", "lifestyle", "television",
    "history", "science", "current-affairs", "sports",
    "personal-experience", "miscellaneous",
]


def normalize_tag(t: str) -> str:
    return t.strip().lower().replace(" ", "-")


def clean_tags(tags: list[str]) -> list[str]:
    """Lowercase, trim, drop empties, dedupe (preserve insertion order)."""
    seen, out = set(), []
    for t in tags or []:
        n = normalize_tag(t)
        if n and n not in seen and len(n) <= 30:
            seen.add(n)
            out.append(n)
    return out