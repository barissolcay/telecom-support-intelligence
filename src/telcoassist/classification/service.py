from dataclasses import dataclass

TAXONOMY: dict[tuple[str, str], tuple[str, ...]] = {
    ("fixed_internet", "complete_outage"): ("internet yok", "bağlantı yok", "no internet", "complete outage", "dsl ışığı"),
    ("fixed_internet", "speed_degradation"): ("yavaş", "hız", "slow", "speed", "throughput", "akşam"),
    ("fixed_internet", "intermittent_connection"): ("kopuyor", "kesiliyor", "intermittent", "disconnect"),
    ("fixed_internet", "high_latency"): ("ping", "gecikme", "latency"),
    ("fixed_internet", "installation"): ("kurulum", "installation", "aktivasyon"),
    ("fixed_internet", "modem_configuration"): ("modem", "wifi şifre", "configuration", "error 651"),
    ("mobile", "mobile_data"): ("mobil veri", "4g", "5g", "mobile data", "apn"),
    ("mobile", "voice_call"): ("arama yapam", "çağrı", "voice call"),
    ("mobile", "sms"): ("sms", "mesaj gönder"),
    ("mobile", "roaming"): ("roaming", "yurt dışı", "abroad"),
    ("mobile", "sim"): ("sim", "kartım çalındı", "sim card"),
    ("mobile", "coverage"): ("çekmiyor", "sinyal", "coverage", "signal"),
    ("billing", "incorrect_charge"): ("fazla ücret", "yanlış ücret", "incorrect charge", "izinsiz işlem"),
    ("billing", "invoice_request"): ("fatura", "invoice"),
    ("billing", "payment"): ("ödeme", "payment"),
    ("billing", "refund"): ("iade", "refund"),
    ("account", "authentication"): ("giriş yapam", "şifre", "login", "password"),
    ("account", "cancellation"): ("iptal", "cancel"),
    ("account", "subscription"): ("abonelik", "subscription", "paket değiş"),
}


@dataclass(frozen=True)
class ClassificationResult:
    category: str
    subcategory: str
    confidence: float


def classify(text: str) -> ClassificationResult:
    lowered = text.lower()
    ranked: list[tuple[int, tuple[str, str]]] = []
    for labels, keywords in TAXONOMY.items():
        score = sum(2 if " " in word else 1 for word in keywords if word in lowered)
        ranked.append((score, labels))
    ranked.sort(reverse=True)
    best_score, (category, subcategory) = ranked[0]
    second_score = ranked[1][0]
    if best_score == 0:
        return ClassificationResult("other", "unclassified", 0.38)
    margin = max(0, best_score - second_score)
    confidence = min(0.98, 0.66 + best_score * 0.07 + margin * 0.04)
    return ClassificationResult(category, subcategory, round(confidence, 2))
