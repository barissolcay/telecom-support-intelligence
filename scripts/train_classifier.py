import json
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, f1_score, log_loss
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import FeatureUnion, Pipeline

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "synthetic" / "tickets.jsonl"
MODEL = ROOT / "ml" / "model_registry" / "tfidf_logreg.joblib"
REPORT = ROOT / "reports" / "classification" / "metrics.json"


def read_rows() -> list[dict]:
    return [json.loads(line) for line in DATA.read_text(encoding="utf-8").splitlines() if line]


def main() -> None:
    rows = read_rows()
    texts = np.array([row["text"] for row in rows])
    labels = np.array([row["label"] for row in rows])
    groups = np.array([row["scenario_group"] for row in rows])
    languages = np.array([row["language"] for row in rows])
    train_idx, test_idx = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=42).split(texts, labels, groups))
    model = Pipeline([
        ("features", FeatureUnion([
            ("word", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2, max_features=35_000)),
        ])),
        ("classifier", LogisticRegression(max_iter=1_000, C=4.0, class_weight="balanced")),
    ])
    started = time.perf_counter()
    model.fit(texts[train_idx], labels[train_idx])
    train_seconds = time.perf_counter() - started
    started = time.perf_counter()
    predictions = model.predict(texts[test_idx])
    probabilities = model.predict_proba(texts[test_idx])
    latency_ms = (time.perf_counter() - started) * 1_000 / len(test_idx)
    report = classification_report(labels[test_idx], predictions, output_dict=True, zero_division=0)
    language_f1 = {lang: round(float(f1_score(labels[test_idx][languages[test_idx] == lang], predictions[languages[test_idx] == lang], average="macro")), 4) for lang in ("tr", "en")}
    top_confidence = probabilities.max(axis=1)
    correct = (predictions == labels[test_idx]).astype(int)
    prob_true, prob_pred = calibration_curve(correct, top_confidence, n_bins=5, strategy="uniform")
    ece = float(np.mean(np.abs(prob_true - prob_pred))) if len(prob_true) else 0.0
    metrics = {
        "dataset_version": "1.0.0", "records": len(rows), "train_records": len(train_idx), "test_records": len(test_idx),
        "split": "scenario-template group split", "macro_f1": round(float(report["macro avg"]["f1-score"]), 4),
        "weighted_f1": round(float(report["weighted avg"]["f1-score"]), 4), "language_macro_f1": language_f1,
        "log_loss": round(float(log_loss(labels[test_idx], probabilities, labels=model.classes_)), 4),
        "calibration_ece_proxy": round(ece, 4), "mean_inference_latency_ms": round(latency_ms, 4),
        "training_seconds": round(train_seconds, 3),
        "per_class": {label: {key: round(float(value), 4) for key, value in scores.items() if key in {"precision", "recall", "f1-score"}} for label, scores in report.items() if "/" in label},
        "gate": {"macro_f1_target": 0.85, "passed": report["macro avg"]["f1-score"] >= .85},
    }
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": model, "version": "1.0.0", "labels": model.classes_.tolist()}, MODEL)
    REPORT.write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"macro_f1": metrics["macro_f1"], "latency_ms": metrics["mean_inference_latency_ms"]}, indent=2))


if __name__ == "__main__":
    main()
