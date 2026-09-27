"""
train.py — Train all four sentiment classifiers on Sentiment140.

Usage:
    python train.py

Output:
    ml-service/artifacts/logistic_regression.joblib
    ml-service/artifacts/linear_svc.joblib
    ml-service/artifacts/naive_bayes.joblib
    ml-service/artifacts/xgboost.joblib
    ml-service/artifacts/metrics.json

Prerequisites:
    Place the Sentiment140 CSV at:
        ml-service/data/training.1600000.processed.noemoticon.csv

    Install requirements:
        pip install -r requirements.txt
        pip install xgboost  # if not already included
"""

from pathlib import Path
import json
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("WARNING: xgboost not installed — skipping XGBoost model.")
    print("Install it with:  pip install xgboost")


# ── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "training.1600000.processed.noemoticon.csv"
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)

# Sentiment140 column names (no header row in the CSV)
COLUMNS = ["sentiment", "id", "date", "query", "user", "text"]

# Set to an integer to train on a stratified sample (faster for dev).
# Set to None to use the full 1.6 M rows.
SAMPLE_SIZE = 200_000


# ── Data loading ─────────────────────────────────────────────────────────────

def load_dataset():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"\n\nDataset not found: {DATA_PATH}\n"
            "Download Sentiment140 from:\n"
            "  https://www.kaggle.com/datasets/kazanova/sentiment140\n"
            "and place the CSV at the path above.\n"
        )

    print(f"Loading dataset from {DATA_PATH} ...")
    df = pd.read_csv(
        DATA_PATH,
        encoding="latin-1",
        header=None,
        names=COLUMNS,
        usecols=[0, 5],          # only sentiment label + text
    )

    # Sentiment140 labels: 0 = negative, 4 = positive
    df = df[df["sentiment"].isin([0, 4])].copy()
    df["label"] = df["sentiment"].map({0: 0, 4: 1})
    df["text"] = df["text"].fillna("").astype(str)
    df = df[df["text"].str.strip().ne("")]

    print(f"Loaded {len(df):,} samples  "
          f"(positive: {df['label'].sum():,}, "
          f"negative: {(df['label'] == 0).sum():,})")

    return df["text"], df["label"]


# ── Evaluation ───────────────────────────────────────────────────────────────

def evaluate(name, pipeline, X_test, y_test):
    predictions = pipeline.predict(X_test)

    metrics = {
        "accuracy":  float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall":    float(recall_score(y_test, predictions, zero_division=0)),
        "f1":        float(f1_score(y_test, predictions, zero_division=0)),
    }

    print(f"\n{'=' * 50}")
    print(f"  {name}")
    print(f"{'=' * 50}")
    print(json.dumps(metrics, indent=2))
    print(classification_report(
        y_test, predictions,
        target_names=["negative", "positive"],
        zero_division=0,
    ))
    return metrics


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    X, y = load_dataset()

    # Optional stratified sample
    if SAMPLE_SIZE and len(X) > SAMPLE_SIZE:
        print(f"\nUsing a stratified sample of {SAMPLE_SIZE:,} rows ...")
        X, _, y, _ = train_test_split(
            X, y,
            train_size=SAMPLE_SIZE,
            stratify=y,
            random_state=42,
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    print(f"\nTrain size: {len(X_train):,}   Test size: {len(X_test):,}\n")

    # Shared TF-IDF configuration
    tfidf_kwargs = dict(
        max_features=100_000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
    )

    models = {
        "logistic_regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            C=1.0,
            solver="lbfgs",
            n_jobs=-1,
        ),
        "linear_svc": LinearSVC(
            class_weight="balanced",
            max_iter=2000,
            C=0.5,
        ),
        "naive_bayes": MultinomialNB(alpha=0.1),
    }

    if HAS_XGBOOST:
        models["xgboost"] = XGBClassifier(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="binary:logistic",
            eval_metric="logloss",
            n_jobs=-1,
            random_state=42,
            verbosity=0,
        )

    all_metrics = {}

    for name, classifier in models.items():
        print(f"\n-> Training {name} ...")

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(**tfidf_kwargs)),
            ("classifier", classifier),
        ])

        pipeline.fit(X_train, y_train)

        metrics = evaluate(name, pipeline, X_test, y_test)
        all_metrics[name] = metrics

        out_path = ARTIFACT_DIR / f"{name}.joblib"
        joblib.dump(pipeline, out_path)
        print(f"  Saved -> {out_path}")

    # Persist metrics summary
    metrics_path = ARTIFACT_DIR / "metrics.json"
    with open(metrics_path, "w") as fh:
        json.dump(all_metrics, fh, indent=2)

    print(f"\n{'=' * 50}")
    print("  Training complete!")
    print(f"  Artifacts -> {ARTIFACT_DIR}")
    print(f"  Metrics   -> {metrics_path}")
    print(f"{'=' * 50}\n")

    # Summary table
    print(f"{'Model':<25} {'Accuracy':>10} {'F1':>8}")
    print("-" * 46)
    for name, m in all_metrics.items():
        print(f"{name:<25} {m['accuracy']:>10.4f} {m['f1']:>8.4f}")
    print()


if __name__ == "__main__":
    main()
