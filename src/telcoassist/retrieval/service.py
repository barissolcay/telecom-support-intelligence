import math
import re
from collections import Counter
from typing import Any


def tokens(text: str) -> list[str]:
    normalized = text.lower().replace("i\u0307", "i")
    return re.findall(r"[a-zA-Zçğıöşü0-9]+", normalized)


def lexical_score(query: str, candidate: str) -> float:
    q, c = Counter(tokens(query)), Counter(tokens(candidate))
    shared = sum(min(q[word], c[word]) for word in q)
    return shared / max(1, math.sqrt(sum(q.values()) * sum(c.values())))


def hybrid_search(query: str, items: list[dict[str, Any]], *, product: str | None = None, limit: int = 5) -> list[dict[str, Any]]:
    scored = []
    synonyms = {"yavaş": "hız speed degradation", "kopuyor": "kesinti intermittent", "çekmiyor": "signal coverage"}
    expanded = query + " " + " ".join(value for key, value in synonyms.items() if key in query.lower())
    for item in items:
        if product and item.get("product") not in {product, None}:
            continue
        haystack = " ".join(str(item.get(key, "")) for key in ("title", "summary", "content", "resolution", "subcategory"))
        lexical = lexical_score(expanded, haystack)
        metadata = 0.16 if product and item.get("product") == product else 0
        outcome = 0.08 if item.get("outcome") == "resolved" else 0
        score = min(0.99, lexical * 1.65 + metadata + outcome)
        scored.append({**item, "similarity": round(score, 2)})
    return sorted(scored, key=lambda value: value["similarity"], reverse=True)[:limit]
