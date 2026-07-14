from pathlib import Path

from sqlalchemy import create_engine

from telcoassist.database.models import Base
from telcoassist.retrieval.qdrant import build_hybrid_query


def test_database_schema_creates_expected_tables():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    assert {
        "tickets",
        "ticket_predictions",
        "ticket_messages",
        "knowledge_documents",
        "document_chunks",
        "ai_answers",
        "answer_citations",
        "feedback",
    } <= set(Base.metadata.tables)
    engine.dispose()


def test_qdrant_query_uses_rrf_and_metadata_filters():
    payload = build_hybrid_query(
        [0.1, 0.2], [10, 20], [0.8, 0.5], product="fixed_internet", region="Ankara"
    )
    assert payload["query"] == {"fusion": "rrf"}
    assert {entry["using"] for entry in payload["prefetch"]} == {"dense", "sparse"}
    filters = payload["prefetch"][0]["filter"]["must"]
    assert {item["key"] for item in filters} == {"product", "region", "outcome"}


def test_example_environment_is_safe_for_host_development():
    values = dict(
        line.split("=", 1)
        for line in Path(".env.example").read_text(encoding="utf-8").splitlines()
        if line and not line.startswith("#")
    )
    assert values["STORAGE_BACKEND"] == "memory"
    assert values["DATABASE_URL"].startswith("sqlite:///")
    assert values["QDRANT_URL"] == "http://localhost:6333"
