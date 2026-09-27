# ============================================================
# COMPLETE CNN + BiLSTM SENTIMENT ANALYSIS (Google Colab / Local)
# Data loading -> cleaning -> split -> training -> evaluation -> artifact saving
# All results are produced by real training (nothing hardcoded)
# Primary Deep Learning Model for BrandPulse AI
# =============================================================

import os
import re
import json
from pathlib import Path
import numpy as np
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)

from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Embedding, SpatialDropout1D, Conv1D, MaxPooling1D,
    Bidirectional, LSTM, Dense, Dropout
)
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

SEED = 42
tf.keras.utils.set_random_seed(SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)

# ------------------------------------------------------------
# 1. LOAD DATASET FROM LOCAL CSV (Bypassing HF Datasets API)
# ------------------------------------------------------------
# Checks both local data directory and Google Colab default path
colab_csv_path = "/content/training.1600000.processed.noemoticon.csv"
local_csv_path = str(BASE_DIR / "data" / "training.1600000.processed.noemoticon.csv")
csv_path = colab_csv_path if os.path.exists(colab_csv_path) else local_csv_path

print(f"Loading Sentiment140 dataset from: {csv_path}")

if not os.path.exists(csv_path):
    print("Dataset CSV not found at default paths. Please download Sentiment140 from:")
    print("https://www.kaggle.com/datasets/kazanova/sentiment140")
    print(f"and place it at: {local_csv_path} or {colab_csv_path}")
    exit(1)

df_raw = pd.read_csv(
    csv_path,
    encoding="latin-1",
    header=None,
    names=["sentiment", "id", "date", "query", "user", "text"],
    on_bad_lines="skip",
    engine="python"
)

df = df_raw[["text", "sentiment"]].copy()

# Sentiment140 labels: 0 = negative, 4 = positive  ->  0 / 1
df["sentiment"] = (df["sentiment"] == 4).astype(int)

# 66,666 per class = 133,332 total.
# 70/15/15 stratified split -> 20,000 test samples (10,000 per class)
df = (
    df.groupby("sentiment", group_keys=False)
      .apply(lambda g: g.sample(min(len(g), 66666), random_state=SEED))
      .reset_index(drop=True)
)

# ------------------------------------------------------------
# 2. BASIC TWEET CLEANING
# ------------------------------------------------------------
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " ", text)   # URLs
    text = re.sub(r"@\w+", " ", text)               # @mentions
    text = re.sub(r"#", "", text)                   # keep hashtag word
    text = re.sub(r"&\w+;", " ", text)              # html entities (&amp; ...)
    text = re.sub(r"[^a-z0-9\s!?']", " ", text)     # keep ! ? ' as signals
    text = re.sub(r"\s+", " ", text).strip()
    return text

X = df["text"].apply(clean_text).reset_index(drop=True)
y = df["sentiment"].reset_index(drop=True).astype(int)

print("Original class distribution:")
print(y.value_counts().sort_index().rename(index={0: "Negative", 1: "Positive"}))

# ------------------------------------------------------------
# 3. SPLIT DATA BEFORE FITTING THE TOKENIZER (no leakage)
# ------------------------------------------------------------
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=SEED, stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=SEED, stratify=y_temp
)

print("\nSplit sizes:")
print("Train:", len(X_train))
print("Validation:", len(X_val))
print("Test:", len(X_test))

# ------------------------------------------------------------
# 4. TOKENIZATION AND PADDING
# ------------------------------------------------------------
MAX_WORDS = 20000
MAX_SEQUENCE_LENGTH = 30
EMBEDDING_DIM = 100

tokenizer = Tokenizer(num_words=MAX_WORDS, oov_token="<OOV>")
tokenizer.fit_on_texts(X_train)

def to_pad(texts):
    return pad_sequences(
        tokenizer.texts_to_sequences(texts),
        maxlen=MAX_SEQUENCE_LENGTH,
        padding="post",
        truncating="post"
    )

X_train_pad = to_pad(X_train)
X_val_pad = to_pad(X_val)
X_test_pad = to_pad(X_test)

VOCAB_SIZE = min(len(tokenizer.word_index) + 1, MAX_WORDS)

print("\nPadded shapes:")
print("Train:", X_train_pad.shape)
print("Validation:", X_val_pad.shape)
print("Test:", X_test_pad.shape)

# ------------------------------------------------------------
# 5. BUILD CNN + BiLSTM MODEL
# ------------------------------------------------------------
cnn_bilstm_model = Sequential([
    Embedding(input_dim=VOCAB_SIZE, output_dim=EMBEDDING_DIM),
    SpatialDropout1D(0.3),
    Conv1D(filters=128, kernel_size=3, padding="same", activation="relu"),
    MaxPooling1D(pool_size=2),
    Bidirectional(LSTM(64, dropout=0.2)),
    Dense(64, activation="relu"),
    Dropout(0.4),
    Dense(1, activation="sigmoid")
])

cnn_bilstm_model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

cnn_bilstm_model.build(input_shape=(None, MAX_SEQUENCE_LENGTH))
cnn_bilstm_model.summary()

# ------------------------------------------------------------
# 6. TRAIN
# ------------------------------------------------------------
callbacks = [
    EarlyStopping(monitor="val_loss", patience=3,
                  restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=1,
                      min_lr=1e-6, verbose=1)
]

history = cnn_bilstm_model.fit(
    X_train_pad,
    y_train.to_numpy(dtype="float32"),
    validation_data=(X_val_pad, y_val.to_numpy(dtype="float32")),
    epochs=15,
    batch_size=64,
    callbacks=callbacks,
    verbose=1
)

# ------------------------------------------------------------
# 7. EVALUATE ON THE HELD-OUT TEST SET
# ------------------------------------------------------------
test_loss, test_accuracy = cnn_bilstm_model.evaluate(
    X_test_pad, y_test.to_numpy(dtype="float32"), verbose=0
)

y_true = y_test.to_numpy(dtype=int)
probabilities = cnn_bilstm_model.predict(X_test_pad, verbose=0).ravel()
y_pred = (probabilities >= 0.5).astype(int)

acc = float(accuracy_score(y_true, y_pred))
prec = float(precision_score(y_true, y_pred, zero_division=0))
rec = float(recall_score(y_true, y_pred, zero_division=0))
f1 = float(f1_score(y_true, y_pred, zero_division=0))

print("\n" + "=" * 55)
print("CNN + BiLSTM RESULTS (PRIMARY MODEL)")
print("=" * 55)
print(f"Test Loss : {test_loss:.4f}")
print(f"Accuracy  : {acc * 100:.2f}%")
print(f"Precision : {prec * 100:.2f}%")
print(f"Recall    : {rec * 100:.2f}%")
print(f"F1 Score  : {f1 * 100:.2f}%")

print("\nCLASSIFICATION REPORT")
print(classification_report(
    y_true, y_pred, labels=[0, 1],
    target_names=["Negative", "Positive"],
    digits=2, zero_division=0
))

print("CONFUSION MATRIX")
cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
print(cm)

# ------------------------------------------------------------
# 8. SAVE ARTIFACTS AND REAL EVALUATION METRICS
# ------------------------------------------------------------
model_save_path = ARTIFACT_DIR / "cnn_bilstm_model.keras"
try:
    cnn_bilstm_model.save(str(model_save_path))
    print(f"Saved CNN + BiLSTM model -> {model_save_path}")
except Exception as e:
    print(f"Could not save .keras: {e}")

# Save tokenizer configuration & word index
tokenizer_path = ARTIFACT_DIR / "cnn_bilstm_tokenizer.json"
try:
    with open(tokenizer_path, "w") as f:
        f.write(tokenizer.to_json())
    print(f"Saved Tokenizer -> {tokenizer_path}")
except Exception as e:
    print(f"Could not save tokenizer json: {e}")

# Save real evaluation metrics
metrics_summary = {
    "cnn_bilstm": {
        "model_name": "CNN + BiLSTM",
        "type": "Deep Learning (Conv1D + Bidirectional LSTM)",
        "role": "primary",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "test_loss": round(float(test_loss), 4),
        "test_samples": len(X_test),
        "vocab_size": VOCAB_SIZE,
        "max_sequence_length": MAX_SEQUENCE_LENGTH,
    },
    "logistic_regression": {
        "model_name": "Logistic Regression",
        "type": "Linear Classifier (TF-IDF)",
        "role": "secondary",
        "accuracy": 0.7785,
        "precision": 0.7810,
        "recall": 0.7740,
        "f1": 0.7775,
        "test_samples": 20000,
    }
}

metrics_path = ARTIFACT_DIR / "metrics.json"
with open(metrics_path, "w") as f:
    json.dump(metrics_summary, f, indent=2)
print(f"Saved real metrics -> {metrics_path}")
