import json
import random
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "synthetic" / "tickets.jsonl"
SEED = 20260714

SCENARIOS = [
    ("fixed_internet", "complete_outage", "high", "İnternet bağlantım tamamen yok, DSL ışığı yanıp sönüyor.", "There is no internet connection and the DSL light is blinking."),
    ("fixed_internet", "speed_degradation", "medium", "Akşam saatlerinde internet hızım çok yavaşlıyor.", "My internet speed becomes very slow during the evening."),
    ("fixed_internet", "intermittent_connection", "high", "DSL bağlantım gün içinde sürekli kopuyor.", "My DSL connection keeps disconnecting during the day."),
    ("fixed_internet", "high_latency", "medium", "Oyun oynarken ping ve gecikme çok yükseliyor.", "Latency and ping become very high while gaming."),
    ("fixed_internet", "installation", "low", "Yeni internet kurulumum için aktivasyon bekliyorum.", "I am waiting for activation of my new internet installation."),
    ("fixed_internet", "modem_configuration", "low", "Modem kurulumu ve Wi-Fi şifresi için yardım gerekiyor.", "I need help with modem configuration and the Wi-Fi password."),
    ("mobile", "mobile_data", "medium", "Mobil veri açık olmasına rağmen 5G bağlantısı kurulamıyor.", "Mobile data is enabled but the phone cannot connect to 5G."),
    ("mobile", "voice_call", "high", "Telefonumdan arama yapamıyorum ancak mobil veri çalışıyor.", "I cannot make voice calls although mobile data works."),
    ("mobile", "sms", "medium", "SMS mesajı gönderemiyorum ve hata alıyorum.", "I cannot send SMS messages and receive an error."),
    ("mobile", "roaming", "medium", "Yurt dışında roaming açık ama mobil veri çalışmıyor.", "Roaming is enabled abroad but mobile data does not work."),
    ("mobile", "sim", "high", "SIM kartım çalındı ve hattımı güvene almak istiyorum.", "My SIM card was stolen and I need to secure the line."),
    ("mobile", "coverage", "medium", "Bulunduğum bölgede telefon çekmiyor ve sinyal yok.", "There is no signal or mobile coverage in my area."),
    ("billing", "incorrect_charge", "critical", "Faturamda tanımadığım izinsiz bir mobil ödeme var.", "My bill contains an unauthorized mobile payment."),
    ("billing", "invoice_request", "low", "Geçen aya ait faturanın bir kopyasını istiyorum.", "I need a copy of last month's invoice."),
    ("billing", "payment", "medium", "Ödeme yaptım ancak faturam hâlâ ödenmemiş görünüyor.", "I paid but the invoice still appears unpaid."),
    ("billing", "refund", "medium", "İptal edilen paket için ücret iadesi bekliyorum.", "I am waiting for a refund for a cancelled package."),
    ("account", "authentication", "medium", "Hesabıma giriş yapamıyorum ve şifre yenilenmiyor.", "I cannot log in and password reset does not work."),
    ("account", "cancellation", "medium", "Aboneliğimi iptal etmek istiyorum.", "I want to cancel my subscription."),
    ("account", "subscription", "low", "Abonelik paketimi değiştirmek istiyorum.", "I want to change my subscription package."),
    ("other", "unclassified", "low", "Hizmetimle ilgili genel bilgi almak istiyorum.", "I need general information about my service."),
]

PREFIXES = {
    "tr": ["Merhaba,", "Destek rica ediyorum:", "Dünden beri", "Kontrol eder misiniz?", "Tekrar yazıyorum;", "Uygulama üzerinden bildiriyorum:"],
    "en": ["Hello,", "Please help:", "Since yesterday", "Could you check this?", "I am contacting support again:", "Reporting from the app:"],
}
SUFFIXES = {
    "tr": ["Sorun devam ediyor.", "Yeniden başlatmayı denedim.", "Henüz çözüm bulamadım.", "Acil olmayan ama tekrarlayan bir durum.", "Bilgi verebilir misiniz?", "Kontrol sonucu bekliyorum."],
    "en": ["The issue continues.", "I tried restarting the device.", "I have not found a solution yet.", "It is recurring but not urgent.", "Could you advise?", "I am waiting for a check."],
}


def generate() -> list[dict]:
    rng = random.Random(SEED)
    records: list[dict] = []
    regions = ["İstanbul Avrupa", "İstanbul Anadolu", "Ankara", "İzmir", "Bursa"]
    channels = ["chat", "email", "call", "mobile_app"]
    for scenario_index, (category, subcategory, priority, tr, en) in enumerate(SCENARIOS):
        for language, base in (("tr", tr), ("en", en)):
            for template_index in range(6):
                for variation in range(10):
                    prefix = PREFIXES[language][template_index]
                    suffix = SUFFIXES[language][(variation + template_index) % len(SUFFIXES[language])]
                    duration = (variation % 5) + 1
                    duration_text = f" Süre: {duration} gün." if language == "tr" else f" Duration: {duration} days."
                    text = f"{prefix} {base} {suffix}{duration_text}"
                    record_id = len(records) + 1
                    records.append({
                        "ticket_id": f"SYN-{record_id:05d}", "scenario_group": f"S{scenario_index:02d}-T{template_index}",
                        "language": language, "channel": rng.choice(channels), "text": text,
                        "category": category, "subcategory": subcategory, "label": f"{category}/{subcategory}",
                        "priority": priority, "region": rng.choice(regions),
                        "entities": {"duration_days": duration, "service_type": category},
                        "synthetic": True, "dataset_version": "1.0.0",
                    })
    return records


def validate(records: list[dict]) -> None:
    required = {"ticket_id", "scenario_group", "language", "channel", "text", "category", "subcategory", "priority", "synthetic"}
    assert len(records) >= 2_000
    assert all(required <= row.keys() and row["synthetic"] is True for row in records)
    assert len({row["ticket_id"] for row in records}) == len(records)
    assert len({row["text"] for row in records}) == len(records)
    assert Counter(row["language"] for row in records)["tr"] == Counter(row["language"] for row in records)["en"]


def main() -> None:
    records = generate()
    validate(records)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in records) + "\n", encoding="utf-8")
    print(f"Generated {len(records)} validated synthetic tickets at {OUTPUT}")


if __name__ == "__main__":
    main()
