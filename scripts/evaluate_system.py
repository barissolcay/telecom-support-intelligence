import json
from math import log2
from pathlib import Path

from telcoassist.priority.service import predict_priority
from telcoassist.privacy.redaction import redact
from telcoassist.rag.service import answer
from telcoassist.retrieval.service import hybrid_search
from telcoassist.tickets.seed import SIMILAR_CASES

ROOT = Path(__file__).resolve().parents[1]


def write_report(path: str, value: dict) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"dataset_version": "1.0.0", **value}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def evaluate_priority() -> None:
    fixtures = [
        ("Hiçbir müşterimiz internete çıkamıyor.", "fixed_internet", "critical"),
        ("Hesabımdan izinsiz işlem yapıldı.", "billing", "critical"),
        ("SIM kartım çalındı.", "mobile", "high"),
        ("İnternet tamamen kesildi.", "fixed_internet", "high"),
        ("Üç gündür hız çok yavaş.", "fixed_internet", "medium"),
        ("Fatura kopyası istiyorum.", "billing", "medium"),
        ("Genel bilgi almak istiyorum.", "other", "low"),
    ]
    predictions = [predict_priority(text, category).priority for text, category, _ in fixtures]
    correct = sum(prediction == expected for prediction, (_, _, expected) in zip(predictions, fixtures, strict=True))
    critical_total = sum(expected == "critical" for _, _, expected in fixtures)
    critical_hits = sum(prediction == "critical" and expected == "critical" for prediction, (_, _, expected) in zip(predictions, fixtures, strict=True))
    write_report("reports/classification/priority_metrics.json", {"macro_f1": round(correct / len(fixtures), 4), "critical_recall": round(critical_hits / critical_total, 4), "fixtures": len(fixtures), "gate": {"macro_f1_target": .75, "critical_recall_target": .9}})


def evaluate_privacy() -> None:
    fixtures = [
        ("Bana 0555 123 45 67 numarasından ulaşın.", "[PHONE_1]"),
        ("Adresim user@example.com e-postasında kayıtlı.", "[EMAIL_1]"),
        ("Modem IP adresim 192.168.1.1.", "[IP_1]"),
        ("MAC 00:1A:2B:3C:4D:5E olarak görünüyor.", "[MAC_1]"),
        ("Kart 4242 4242 4242 4242 ile ödeme yaptım.", "[CARD_1]"),
        ("TC numaram 10000000146.", "[NATIONAL_ID_1]"),
    ]
    hits = sum(expected in redact(text)[0] for text, expected in fixtures)
    negatives = ["DSL değeri 12.4 dB", "Ticket TK-1042", "Paket 100 Mbps"]
    false_positives = sum(redact(text)[0] != text for text in negatives)
    write_report("reports/privacy/metrics.json", {"recall": round(hits / len(fixtures), 4), "false_positive_rate": round(false_positives / len(negatives), 4), "critical_leakage": len(fixtures) - hits, "fixtures": len(fixtures), "gate": {"recall_target": .95, "zero_critical_leakage": True}})


def evaluate_retrieval() -> None:
    fixtures = [
        ("Akşamları internet hızım yavaşlıyor", "fixed_internet", "CASE-2031"),
        ("Wi-Fi yavaş ama kablolu bağlantı normal", "fixed_internet", "CASE-1998"),
        ("DSL sürekli kopuyor ve SNR düşük", "fixed_internet", "CASE-1884"),
        ("Aynı bölgede mobil veri bağlantısı yok", "mobile", "CASE-2077"),
    ]
    reciprocal, recall, precision, ndcg = [], [], [], []
    for query, product, expected in fixtures:
        ranked = hybrid_search(query, SIMILAR_CASES, product=product, limit=5)
        ids = [row["id"] for row in ranked]
        rank = ids.index(expected) + 1 if expected in ids else None
        recall.append(1.0 if rank else 0.0)
        reciprocal.append(1 / rank if rank else 0.0)
        precision.append((1.0 if rank else 0.0) / max(1, len(ids)))
        ndcg.append((1 / log2(rank + 1)) if rank else 0.0)
    write_report("reports/retrieval/metrics.json", {"recall_at_5": round(sum(recall) / len(recall), 4), "precision_at_5": round(sum(precision) / len(precision), 4), "mrr": round(sum(reciprocal) / len(reciprocal), 4), "ndcg_at_5": round(sum(ndcg) / len(ndcg), 4), "queries": len(fixtures), "gate": {"recall_at_5_target": .85, "mrr_target": .75}})


def evaluate_rag() -> None:
    fixtures = [
        ("Akşam hız düşüşünde hangi testler uygulanmalı?", "fixed_internet", "DOC-014"),
        ("Çalınan SIM için ne yapılmalı?", "mobile", "DOC-031"),
        ("Mobil veri bağlantı kaybında kontroller nelerdir?", "mobile", "DOC-044"),
    ]
    citations, supported = 0, 0
    for question, category, expected in fixtures:
        result = answer(question, category, min_score=.18)
        source_ids = {source["id"] for source in result["sources"]}
        citations += expected in source_ids
        supported += all(step["source_ids"] for step in result["recommended_steps"])
    refusal = answer("Kuantal uydu yönlendirme protokolü nedir?", "other", min_score=.5)["insufficient_context"]
    write_report("reports/rag/metrics.json", {"citation_correctness": round(citations / len(fixtures), 4), "citation_completeness": round(supported / len(fixtures), 4), "unsupported_claim_rate": round(1 - supported / len(fixtures), 4), "refusal_accuracy": float(refusal), "questions": len(fixtures) + 1, "gate": {"citation_correctness_target": .9, "unsupported_claim_rate_max": .05}})


def main() -> None:
    evaluate_priority()
    evaluate_privacy()
    evaluate_retrieval()
    evaluate_rag()
    print("Evaluation reports updated")


if __name__ == "__main__":
    main()
