from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

def compute_metrics(y_true: List[str], y_pred: List[str]) -> Dict[str, Any]:
    """Computes standard evaluation metrics: accuracy, precision, recall, f1-score, and confusion matrix."""
    labels = sorted(list(set(y_true + y_pred)))
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "labels": labels,
        "confusion_matrix": cm.tolist()
    }
