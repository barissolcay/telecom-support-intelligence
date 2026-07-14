import pytest

from telcoassist.classification.service import classify
from telcoassist.entities.extractor import extract_entities, follow_up_question
from telcoassist.priority.service import predict_priority


@pytest.mark.parametrize(("text", "category", "subcategory"), [
    ("Akşamları internet hızım çok yavaşlıyor", "fixed_internet", "speed_degradation"),
    ("SIM kartım çalındı", "mobile", "sim"),
    ("Faturamda yanlış ücret var", "billing", "incorrect_charge"),
    ("Şifremle giriş yapamıyorum", "account", "authentication"),
])
def test_hierarchical_classification(text, category, subcategory):
    result = classify(text)
    assert (result.category, result.subcategory) == (category, subcategory)
    assert 0 <= result.confidence <= 1


def test_unknown_classification_requires_review_confidence():
    result = classify("Yardım rica ediyorum")
    assert result.category == "other" and result.confidence < .6


@pytest.mark.parametrize(("text", "expected"), [
    ("Hiçbir müşterimiz internete çıkamıyor", "critical"),
    ("SIM kartım çalındı", "high"),
    ("Üç gündür tekrar yavaşlıyor", "medium"),
    ("Genel bilgi istiyorum", "low"),
])
def test_priority_safety_rules(text, expected):
    assert predict_priority(text, "fixed_internet").priority == expected


def test_entities_and_follow_up():
    text = "Huawei HG658 modem kullanıyorum. Son 2 gündür DSL ışığı yanıp sönüyor, yeniden başlattım."
    entities = extract_entities(text, "fixed_internet")
    assert entities["device_model"] == "Huawei HG658"
    assert entities["indicator_state"] == "blinking"
    assert entities["customer_action"] == "modem_restarted"
    assert follow_up_question(entities, "fixed_internet", "tr") is not None
    assert follow_up_question({"connection_type": "wifi"}, "fixed_internet", "tr") is None
