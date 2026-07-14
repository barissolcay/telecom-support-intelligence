import re
from typing import Any

_DURATION_PATTERN = re.compile(
    r"\b(?:son[ \t]{1,8})?([0-9]{1,4})(?![0-9])[ \t]{0,8}"
    r"(gün|day|saat|hour|hafta|week)",
    re.I,
)
_DEVICE_MODEL_PATTERN = re.compile(r"\b(?:huawei|zte|tp-?link|zyxel|nokia)\s+[a-z0-9-]{3,}\b", re.I)
_ERROR_CODE_PATTERN = re.compile(
    r"\b(?:error|hata|sip)[ \t]{0,8}[-:]?[ \t]{0,8}([0-9]{3,5})\b",
    re.I,
)


def extract_entities(text: str, category: str) -> dict[str, Any]:
    value = text.lower()
    entities: dict[str, Any] = {"service_type": category}

    duration = _DURATION_PATTERN.search(value)
    if duration:
        entities["duration"] = f"{duration.group(1)} {duration.group(2)}"
    model = _DEVICE_MODEL_PATTERN.search(text)
    if model:
        entities["device_model"] = model.group(0)
    error = _ERROR_CODE_PATTERN.search(text)
    if error:
        entities["error_code"] = error.group(1)
    if any(x in value for x in ("akşam", "evening", "20.00", "peak hour")):
        entities["time_pattern"] = "evening"
    if "wi-fi" in value or "wifi" in value:
        entities["connection_type"] = "wifi"
    if "ethernet" in value or "kablolu" in value:
        entities["connection_type"] = "ethernet" if "connection_type" not in entities else "wifi_and_ethernet"
    if any(x in value for x in ("yeniden başlat", "restart", "reboot")):
        entities["customer_action"] = "modem_restarted"
    if "dsl" in value and any(x in value for x in ("yanıp sön", "blink")):
        entities.update({"indicator": "DSL", "indicator_state": "blinking"})
    for region in ("İstanbul Avrupa", "İstanbul Anadolu", "Ankara", "İzmir", "Bursa"):
        if region.lower() in value:
            entities["region"] = region
    return entities


def follow_up_question(entities: dict[str, Any], category: str, language: str) -> str | None:
    if category == "fixed_internet" and "connection_type" not in entities:
        return (
            "Hız düşüşü hem Wi-Fi hem de Ethernet bağlantısında görülüyor mu?"
            if language == "tr"
            else "Is the degradation visible on both Wi-Fi and Ethernet?"
        )
    if category == "mobile" and "region" not in entities:
        return "Sorunu yaşadığınız bölgeyi paylaşabilir misiniz?" if language == "tr" else "Which region is affected?"
    return None
