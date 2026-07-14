# Model card

## Default classifier

TF-IDF character/word features with Logistic Regression provide hierarchical ticket category and subcategory predictions. The artifact is produced by `scripts/train_classifier.py`; measured results are written to `reports/classification/metrics.json`.

The baseline is selected for low CPU latency, small footprint, reproducibility, and interpretable vocabulary behavior. XLM-RoBERTa is an optional comparison candidate when operator-approved data and suitable inference infrastructure are available. A transformer must not replace the baseline based on aggregate F1 alone; class recall, Turkish/English slices, calibration, latency, CPU use, size, and low-confidence frequency are release gates.

## Intended use

Decision support for human agents on telecom support tickets. Low-confidence predictions require review. The model is not suitable for autonomous routing of safety or security cases.
