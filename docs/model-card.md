# Model card

## Offline classifier candidate

TF-IDF character/word features with Logistic Regression are evaluated as a hierarchical ticket category and subcategory candidate. The artifact is produced by `scripts/train_classifier.py`; measured results are written to `reports/classification/metrics.json`.

The demo API does not load this artifact. Its runtime classification path is `deterministic-taxonomy-v1`, a keyword/taxonomy baseline that keeps the repository runnable without a model artifact. This separation is deliberate and exposed in the UI and README.

The offline candidate is useful for measuring low CPU latency, small footprint, reproducibility, and vocabulary behavior. XLM-RoBERTa remains a possible future comparison when operator-approved data and suitable inference infrastructure are available. No candidate should replace the runtime baseline based on aggregate F1 alone; class recall, Turkish/English slices, calibration, latency, CPU use, size, and low-confidence frequency are release gates.

## Intended use

Decision support for human agents on telecom support tickets. Low-confidence predictions require review. The model is not suitable for autonomous routing of safety or security cases.
