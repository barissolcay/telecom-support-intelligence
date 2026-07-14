from datetime import datetime, timedelta, timezone

from telcoassist.common.schemas import Message, Ticket


def seed_tickets() -> list[Ticket]:
    rows = [
        ("TK-1042", "Evening internet slowdown", "Son üç gündür özellikle akşam 20.00'den sonra internet hızım çok düşüyor. Modemi yeniden başlattım ama değişiklik olmadı.", "İstanbul Anadolu", "fixed_internet", "speed_degradation", "medium", .94, "18 min ago", None),
        ("TK-1041", "Mobile data unavailable", "Kadıköy bölgesinde sabahtan beri 5G bağlantısı kurulamıyor.", "İstanbul Anadolu", "mobile", "mobile_data", "high", .88, "24 min ago", "Deniz A."),
        ("TK-1039", "Unknown card transaction", "Faturamda bana ait olmayan bir mobil ödeme işlemi görüyorum.", "Ankara", "billing", "incorrect_charge", "critical", .96, "31 min ago", "Ece K."),
        ("TK-1038", "Intermittent DSL", "DSL bağlantım gün içinde sürekli kopuyor, ZTE H3600 modem kullanıyorum.", "Bursa", "fixed_internet", "intermittent_connection", "high", .91, "42 min ago", "Mert S."),
        ("TK-1035", "Roaming activation", "Almanya'dayım, roaming açık görünmesine rağmen mobil veri kullanamıyorum.", "İzmir", "mobile", "roaming", "medium", .82, "1 hr ago", None),
        ("TK-1032", "Invoice copy request", "Could you email a copy of my June invoice?", "İstanbul Avrupa", "billing", "invoice_request", "low", .97, "2 hr ago", "Ece K."),
        ("TK-1028", "Account login issue", "Uygulamaya giriş yapamıyorum ve şifre sıfırlama mesajı gelmiyor.", "Ankara", "account", "authentication", "medium", .76, "3 hr ago", "Deniz A."),
        ("TK-1025", "Unclear connection issue", "Bağlantı bazen garip davranıyor, yardımcı olur musunuz?", "Unknown", "other", "unclassified", "low", .48, "4 hr ago", None),
    ]
    tickets = []
    for id_, title, message, region, category, subcategory, priority, confidence, created, assigned in rows:
        amount, unit, _ = created.split()
        delta = timedelta(minutes=int(amount)) if unit == "min" else timedelta(hours=int(amount))
        created_at = (datetime.now(timezone.utc) - delta).isoformat()
        tickets.append(Ticket(
            id=id_, customer_id=f"CUST-{id_[-4:]}", title=title, region=region, category=category,
            subcategory=subcategory, priority=priority, confidence=confidence, created_at=created_at,
            assigned_to=assigned, redacted_text=message, summary=message.split(".")[0] + ".",
            messages=[Message(author="customer", body=message, created_at=created_at)], ai_reviewed=False,
        ))
    return tickets


SIMILAR_CASES = [
    {"id": "CASE-2031", "title": "Peak-hour throughput degradation", "summary": "Evening speed degradation affecting wired and wireless devices.", "resolution": "Regional capacity congestion confirmed. Capacity expansion request opened and customer informed.", "product": "fixed_internet", "subcategory": "speed_degradation", "region": "İstanbul Anadolu", "outcome": "resolved", "resolution_time": "2d 4h", "date": "2026-06-28"},
    {"id": "CASE-1998", "title": "Local Wi-Fi interference", "summary": "Speed was normal over Ethernet but unstable on 2.4 GHz Wi-Fi.", "resolution": "Wi-Fi channel changed and modem relocated away from interference.", "product": "fixed_internet", "subcategory": "speed_degradation", "region": "Ankara", "outcome": "resolved", "resolution_time": "38m", "date": "2026-05-14"},
    {"id": "CASE-1884", "title": "DSL line quality regression", "summary": "Repeated DSL drops and low SNR on a fixed internet line.", "resolution": "Outside line fault repaired after field team escalation.", "product": "fixed_internet", "subcategory": "intermittent_connection", "region": "Bursa", "outcome": "resolved", "resolution_time": "1d 6h", "date": "2026-03-02"},
    {"id": "CASE-2077", "title": "Regional mobile packet loss", "summary": "Mobile data unavailable for multiple subscribers in the same district.", "resolution": "Radio access incident escalated; service restored after site reset.", "product": "mobile", "subcategory": "mobile_data", "region": "İstanbul Anadolu", "outcome": "resolved", "resolution_time": "3h 12m", "date": "2026-07-02"},
]
