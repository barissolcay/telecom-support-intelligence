from telcoassist.knowledge.catalog import DOCUMENTS
from telcoassist.rag.service import answer
from telcoassist.retrieval.service import hybrid_search, lexical_score, tokens
from telcoassist.tickets.seed import SIMILAR_CASES


def test_tokenization_and_score():
    assert "internet" in tokens("İnternet yavaş")
    assert lexical_score("error 651", "Modem Error 651 guide") > 0


def test_hybrid_search_filters_product_and_ranks_case():
    results = hybrid_search("Akşam internet hızım yavaşlıyor", SIMILAR_CASES, product="fixed_internet")
    assert results[0]["id"] == "CASE-2031"
    assert all(row["product"] == "fixed_internet" for row in results)


def test_rag_cites_only_active_sources():
    result = answer("Akşam hız düşüşünde Wi-Fi ve Ethernet testi", "fixed_internet", min_score=.1)
    assert result["insufficient_context"] is False
    assert result["recommended_steps"]
    assert all(source["status"] == "active" for source in result["sources"])
    assert "DOC-008" not in {source["id"] for source in result["sources"]}


def test_rag_refuses_without_evidence():
    result = answer("Kuantal uydu yönlendirmesi", "other", min_score=.9)
    assert result["insufficient_context"] is True
    assert not result["sources"]


def test_catalog_contains_deprecated_document_for_lifecycle_test():
    assert any(doc["status"] == "deprecated" for doc in DOCUMENTS)
