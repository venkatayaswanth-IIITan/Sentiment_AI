"""
Training pipeline for classical Machine Learning baselines (TF-IDF + Logistic Regression / Linear SVM).
"""
import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from app.evaluation import compute_metrics
from app.preprocessing import clean_text

def train_classical_ml(
    data_path: str = None,
    output_dir: str = "./artifacts",
    model_name: str = "ml_model.pkl"
):
    print("--- Starting Classical ML Model Training ---")
    os.makedirs(output_dir, exist_ok=True)

    # Sample baseline data if no custom path provided
    if data_path and os.path.exists(data_path):
        df = pd.read_csv(data_path)
    else:
        print("Using synthetic starter dataset for training initialization...")
        df = pd.DataFrame([
            {"text": "I absolutely love this product, it works flawlessly!", "label": "POSITIVE"},
            {"text": "Worst experience ever, customer support was rude.", "label": "NEGATIVE"},
            {"text": "The delivery arrived on Tuesday as expected.", "label": "NEUTRAL"},
            {"text": "Super fast delivery and great quality build.", "label": "POSITIVE"},
            {"text": "Terrible software updates constantly crashing my device.", "label": "NEGATIVE"},
            {"text": "The package contains the user manual and power adapter.", "label": "NEUTRAL"},
        ] * 20)

    df["cleaned"] = df["text"].apply(clean_text)
    X_train, X_test, y_train, y_test = train_test_split(
        df["cleaned"], df["label"], test_size=0.2, random_state=42
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
        ("clf", LogisticRegression(max_iter=1000))
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = compute_metrics(y_test.tolist(), y_pred.tolist())
    print(f"Validation Metrics: {metrics}")

    target_path = os.path.join(output_dir, model_name)
    joblib.dump(pipeline, target_path)
    print(f"Saved classical ML artifact to {target_path}")

if __name__ == "__main__":
    train_classical_ml()
