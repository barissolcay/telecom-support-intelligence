from dataclasses import dataclass


@dataclass(frozen=True)
class PriorityResult:
    priority: str
    confidence: float
    signals: list[str]


def predict_priority(text: str, category: str) -> PriorityResult:
    value = text.lower()
    critical = ("hiçbir müşterimiz", "tüm müşteriler", "izinsiz işlem", "data breach", "all customers", "unauthorized")
    high = ("çalındı", "stolen", "tamamen kesildi", "complete outage", "güvenlik", "security")
    signals: list[str] = []
    if any(term in value for term in critical):
        signals.extend(["Multi-subscriber or security impact", "Mandatory safety override"])
        return PriorityResult("critical", 0.97, signals)
    if any(term in value for term in high):
        signals.extend(["Service loss or asset security risk", "Rule-based minimum priority"])
        return PriorityResult("high", 0.93, signals)
    if any(term in value for term in ("3 gün", "üç gün", "tekrar", "recurring", "three days")):
        signals.append("Recurring issue or extended duration")
    if any(term in value for term in ("yavaş", "slow", "kısmen", "degraded")):
        signals.append("Service remains partially available")
    if category in {"billing", "account"}:
        signals.append("Account or billing impact")
    if signals:
        return PriorityResult("medium", 0.79, signals)
    return PriorityResult("low", 0.72, ["Single subscriber", "No outage or safety signal detected"])
