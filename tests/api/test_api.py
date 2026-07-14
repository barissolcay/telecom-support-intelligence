from fastapi.testclient import TestClient

from telcoassist.api.app import app

client = TestClient(app)


def test_health_and_ready():
    assert client.get("/health").json()["status"] == "ok"
    ready = client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["knowledge_documents"] > 0


def test_ticket_flow_and_feedback():
    created = client.post("/api/v1/tickets", json={"channel": "chat", "language": "tr", "message": "Telefonum 0555 123 45 67. Akşam internet hızım yavaşlıyor.", "region": "Ankara"})
    assert created.status_code == 201
    ticket = created.json()
    assert "0555" not in ticket["redacted_text"]
    analysis = client.post(f"/api/v1/tickets/{ticket['id']}/analyze")
    assert analysis.status_code == 200
    assert analysis.json()["classification"]["category"] == "fixed_internet"
    cases = client.get(f"/api/v1/tickets/{ticket['id']}/similar-cases", params={"limit": 3})
    assert cases.status_code == 200 and len(cases.json()) <= 3
    feedback = client.post("/api/v1/feedback", json={"target_type": "classification", "target_id": ticket["id"], "rating": "accepted"})
    assert feedback.status_code == 201
    resolved = client.post(f"/api/v1/tickets/{ticket['id']}/resolve", json={"root_cause": "regional_congestion", "actions_taken": ["regional_alarm_checked"], "resolution": "escalated", "customer_informed": True, "follow_up_required": True, "escalation_team": "capacity", "final_summary": "Capacity team notified."})
    assert resolved.json()["status"] == "resolved"


def test_ticket_not_found():
    assert client.get("/api/v1/tickets/NOPE").status_code == 404


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
    indexed = client.post("/api/v1/knowledge/documents/DOC-NEW/index")
    assert indexed.json()["index_status"] == "indexed"
