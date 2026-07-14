from fastapi.testclient import TestClient

from telcoassist.api.app import app, store

client = TestClient(app)


def test_health_and_ready():
    assert client.get("/health").json()["status"] == "ok"
    ready = client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["knowledge_documents"] > 0


def test_ready_reports_storage_outage(monkeypatch):
    monkeypatch.setattr(store, "ping", lambda: False)
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["detail"] == "Storage is unavailable"


def test_ticket_flow_and_feedback():
    created = client.post("/api/v1/tickets", json={"channel": "chat", "language": "tr", "message": "Telefonum 0555 123 45 67. Akşam internet hızım yavaşlıyor.", "region": "Ankara"})
    assert created.status_code == 201
    ticket = created.json()
    assert "0555" not in ticket["redacted_text"]
    analysis = client.post(f"/api/v1/tickets/{ticket['id']}/analyze")
    assert analysis.status_code == 200
    assert analysis.json()["classification"]["category"] == "fixed_internet"
    assigned = client.patch(f"/api/v1/tickets/{ticket['id']}", json={"assigned_to": "Barış A."})
    assert assigned.status_code == 200 and assigned.json()["assigned_to"] == "Barış A."
    message = client.post(
        f"/api/v1/tickets/{ticket['id']}/messages",
        json={"author": "agent", "body": "Size 0555 222 33 44 numarasından döneceğim."},
    )
    assert message.status_code == 201
    assert "0555" not in message.json()["messages"][-1]["body"]
    cases = client.get(f"/api/v1/tickets/{ticket['id']}/similar-cases", params={"limit": 3})
    assert cases.status_code == 200 and len(cases.json()) <= 3
    feedback = client.post("/api/v1/feedback", json={"target_type": "classification", "target_id": ticket["id"], "rating": "accepted"})
    assert feedback.status_code == 201
    resolved = client.post(f"/api/v1/tickets/{ticket['id']}/resolve", json={"root_cause": "regional_congestion", "actions_taken": ["regional_alarm_checked"], "resolution": "escalated", "customer_informed": True, "follow_up_required": True, "escalation_team": "capacity", "final_summary": "Capacity team notified."})
    assert resolved.json()["status"] == "resolved"


def test_ticket_not_found():
    assert client.get("/api/v1/tickets/NOPE").status_code == 404
    assert client.post("/api/v1/feedback", json={"target_type": "classification", "target_id": "NOPE", "rating": "accepted"}).status_code == 404


def test_copilot_and_analytics():
    response = client.post("/api/v1/copilot/query", json={"ticket_id": "TK-1042", "question": "Wi-Fi ve Ethernet testleri nedir?"})
    assert response.status_code == 200
    assert response.json()["model_version"]
    dashboard = client.get("/api/v1/analytics/dashboard")
    assert dashboard.status_code == 200
    assert "incident" in dashboard.json()


def test_knowledge_upload_limits_and_index():
    documents = client.get("/api/v1/knowledge/documents")
    assert documents.status_code == 200 and documents.json()
    bad = client.post("/api/v1/knowledge/documents", files={"file": ("payload.exe", b"x", "application/octet-stream")})
    assert bad.status_code == 415
    good = client.post("/api/v1/knowledge/documents", files={"file": ("guide.txt", b"Synthetic guide", "text/plain")})
    assert good.status_code == 201
    indexed = client.post(f"/api/v1/knowledge/documents/{good.json()['id']}/index")
    assert indexed.json()["index_status"] == "indexed"
    assert "lexical_indexing" in indexed.json()["stages"]
    assert "embedding" not in indexed.json()["stages"]
    pdf = client.post(
        "/api/v1/knowledge/documents",
        files={"file": ("guide.pdf", b"%PDF-1.7", "application/pdf")},
    )
    assert pdf.status_code == 201
    rejected = client.post(f"/api/v1/knowledge/documents/{pdf.json()['id']}/index")
    assert rejected.status_code == 422
    pdf_state = next(
        document
        for document in client.get("/api/v1/knowledge/documents").json()
        if document["id"] == pdf.json()["id"]
    )
    assert pdf_state["status"] == "draft"
    assert pdf_state["index_status"] == "uploaded"
    assert client.post("/api/v1/knowledge/documents/DOC-MISSING/index").status_code == 404
