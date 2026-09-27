"""
intent.py — Rule-based customer intent classification.
Classifies text into one of 8 intent categories commonly seen in
customer feedback, reviews, and support conversations.
"""
from __future__ import annotations
import re
from typing import Dict, Tuple

# ---------------------------------------------------------------------------
# Intent categories and their trigger signals
# ---------------------------------------------------------------------------
INTENT_LEXICONS: Dict[str, list[str]] = {
    "complaint": [
        "broken", "not working", "doesn't work", "failed", "problem",
        "issue", "defective", "fault", "malfunction", "error", "bug",
        "crash", "corrupted", "damaged", "missing", "wrong", "incorrect",
        "never received", "still waiting", "still haven't", "poor service",
        "terrible experience", "worst", "unacceptable", "disappointed",
        "let down", "false advertising", "misleading",
    ],
    "praise": [
        "love", "amazing", "excellent", "great", "awesome", "fantastic",
        "highly recommend", "best", "outstanding", "perfect", "wonderful",
        "brilliant", "exceeded expectations", "top notch", "5 stars",
        "would buy again", "very happy", "satisfied", "impressed",
        "pleasantly surprised",
    ],
    "refund_request": [
        "refund", "money back", "return", "reimburse", "reimbursement",
        "get my money", "cancel my order", "cancel my subscription",
        "cancel order", "chargeback", "dispute", "want my money",
        "full refund", "partial refund",
    ],
    "inquiry": [
        "how do i", "how can i", "what is", "when will", "where can",
        "is it possible", "can you tell me", "could you explain",
        "do you have", "do you offer", "is there a", "i need to know",
        "can i", "will you", "what are", "who do i contact",
        "how much", "what's the price", "pricing",
    ],
    "suggestion": [
        "you should", "you could", "it would be better", "i wish",
        "would be nice if", "please add", "please consider", "feature request",
        "can you add", "i suggest", "suggestion", "recommend adding",
        "would love to see", "hoping for", "in the future", "next version",
    ],
    "urgency": [
        "urgent", "asap", "immediately", "right away", "emergency",
        "critical", "time sensitive", "need now", "cannot wait",
        "need this fixed", "still not resolved", "been waiting days",
        "been waiting weeks", "escalate",
    ],
    "loyalty_signal": [
        "long time customer", "loyal customer", "always use", "years of using",
        "been a customer", "regularly buy", "always buy", "keep coming back",
        "won't shop anywhere else", "lifetime customer", "fan of",
        "would definitely", "will continue", "will be back",
    ],
    "general_feedback": [],  # fallback
}

NEGATIONS = {"not", "no", "never", "don't", "doesn't", "didn't", "can't",
             "won't", "isn't", "wasn't", "aren't", "weren't"}


def _tokenise(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def classify_intent(text: str) -> Tuple[str, Dict[str, float], float]:
    """
    Classify the customer intent of the given text.

    Returns:
        (primary_intent, distribution_dict, primary_confidence)
    """
    text_lower = text.lower()
    tokens = set(_tokenise(text))

    raw_scores: Dict[str, float] = {intent: 0.0 for intent in INTENT_LEXICONS}

    for intent, keywords in INTENT_LEXICONS.items():
        for kw in sorted(keywords, key=len, reverse=True):
            if kw in text_lower:
                # Simple negation check: preceding 20 chars
                idx = text_lower.find(kw)
                preceding = text_lower[max(0, idx - 20): idx]
                preceding_words = set(re.findall(r"\b\w+\b", preceding))
                if preceding_words & NEGATIONS:
                    raw_scores[intent] -= 0.3
                else:
                    # Longer phrase matches get a higher weight
                    phrase_bonus = 0.5 * len(kw.split())
                    raw_scores[intent] += 1.0 + phrase_bonus

    # Clamp to 0
    raw_scores = {k: max(0.0, v) for k, v in raw_scores.items()}
    total = sum(raw_scores.values())

    if total == 0.0:
        primary = "general_feedback"
        distribution = {k: round(1.0 / len(INTENT_LEXICONS), 3) for k in INTENT_LEXICONS}
        return primary, distribution, 0.5

    distribution = {k: round(v / total, 3) for k, v in raw_scores.items()}
    primary = max(distribution, key=lambda k: distribution[k])
    primary_confidence = distribution[primary]

    # If primary confidence is very low, treat as general feedback
    if primary_confidence < 0.25:
        primary = "general_feedback"

    return primary, distribution, round(primary_confidence, 3)
