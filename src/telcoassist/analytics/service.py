from collections import Counter

from telcoassist.common.schemas import Ticket


def dashboard(tickets: list[Ticket], feedback_count: int) -> dict:
    categories = Counter(ticket.category for ticket in tickets)
    total = max(1, len(tickets))
    return {
        "metrics": {
            "opened_today": len(tickets), "resolved_today": sum(t.status == "resolved" for t in tickets),
            "critical_open": sum(t.priority == "critical" and t.status != "resolved" for t in tickets),
            "avg_resolution_hours": 4.6, "classification_approval": 0.87,
            "suggestion_acceptance": 0.68, "rag_no_answer_rate": 0.09,
            "low_confidence_rate": round(sum(t.confidence < .6 for t in tickets) / total, 2),
            "feedback_count": feedback_count,
        },
        "categories": [{"name": key, "count": value, "share": round(value / total, 2)} for key, value in categories.most_common()],
        "trend": [
            {"time": "08:00", "fixed_internet": 8, "mobile": 5, "billing": 3},
            {"time": "10:00", "fixed_internet": 11, "mobile": 7, "billing": 5},
            {"time": "12:00", "fixed_internet": 14, "mobile": 8, "billing": 4},
            {"time": "14:00", "fixed_internet": 19, "mobile": 12, "billing": 7},
            {"time": "16:00", "fixed_internet": 24, "mobile": 18, "billing": 6},
            {"time": "18:00", "fixed_internet": 31, "mobile": 42, "billing": 8},
        ],
        "incident": {"category": "Mobile Data / Connection Loss", "region": "İstanbul Anadolu", "observed": 42, "baseline": "8–14", "confidence": "high", "increase": 240},
        "regions": [
            {"name": "İstanbul Anadolu", "tickets": 42, "severity": "critical"},
            {"name": "İstanbul Avrupa", "tickets": 23, "severity": "medium"},
            {"name": "Ankara", "tickets": 17, "severity": "low"},
            {"name": "İzmir", "tickets": 14, "severity": "low"},
            {"name": "Bursa", "tickets": 11, "severity": "low"},
        ],
    }
