from typing import Any

from telcoassist.knowledge.catalog import DOCUMENTS
from telcoassist.retrieval.service import hybrid_search


def answer(question: str, category: str, min_score: float = 0.28) -> dict[str, Any]:
    sources = [doc for doc in DOCUMENTS if doc["status"] == "active"]
    ranked = hybrid_search(question, sources, product=category, limit=3)
    evidence = [source for source in ranked if source["similarity"] >= min_score]
    if not evidence:
        return {
            "id": "ANS-INSUFFICIENT", "answer": "No sufficiently relevant source was found.",
            "recommended_steps": [], "confidence": "insufficient_evidence",
            "insufficient_context": True, "sources": [], "model_version": "grounded-template-v1",
            "prompt_version": "copilot-grounding-v1",
        }
    steps = []
    for source in evidence:
        first = source["content"].split(". ")[0].strip().rstrip(".") + "."
        steps.append({"step": first, "source_ids": [source["id"]]})
    return {
        "id": "ANS-DEMO-001", "answer": "Mevcut ticket bağlamı ve aktif prosedürlere göre aşağıdaki kontrolleri uygulayın.",
        "recommended_steps": steps, "confidence": "high" if evidence[0]["similarity"] >= 0.65 else "medium",
        "insufficient_context": False, "sources": evidence, "model_version": "grounded-template-v1",
        "prompt_version": "copilot-grounding-v1",
    }
