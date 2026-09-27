"""
emotion.py — Rule-based emotion detection using expanded lexicons.
Returns the primary emotion and per-emotion probability distribution.
Deliberately deterministic so results are reproducible without an LLM.
"""
from __future__ import annotations
import re
from typing import Dict, Tuple


# ---------------------------------------------------------------------------
# Emotion lexicons — each key maps to a set of trigger words/phrases.
# Phrases take priority over single words (longest-match first).
# ---------------------------------------------------------------------------
EMOTION_LEXICONS: Dict[str, list[str]] = {
    "joy": [
        "love", "great", "excellent", "amazing", "wonderful", "fantastic",
        "happy", "happy", "thrilled", "delighted", "awesome", "enjoy",
        "pleased", "glad", "cheerful", "joyful", "excited", "grateful",
        "thankful", "bliss", "ecstatic", "overjoyed", "satisfied",
        "best", "perfect", "superb", "brilliant", "outstanding", "terrific",
        "recommend", "recommend this", "highly recommend", "love it",
        "worth it", "top notch", "5 stars",
    ],
    "anger": [
        "angry", "furious", "outraged", "livid", "infuriated", "rage",
        "mad", "irritated", "frustrated", "disgusted", "hate", "hated",
        "worst", "terrible", "horrible", "awful", "trash", "garbage",
        "rip off", "scam", "scammed", "fraud", "lied", "cheated",
        "unacceptable", "ridiculous", "absurd", "pathetic", "useless",
        "broken", "defective", "never again", "waste of money",
    ],
    "sadness": [
        "sad", "unhappy", "disappointed", "disappointing", "let down",
        "heartbroken", "depressed", "miserable", "regret", "regretful",
        "unfortunate", "sorry", "wish", "wasted", "didn't meet",
        "below expectations", "not what i expected", "misleading",
        "poor quality", "not worth",
    ],
    "fear": [
        "scared", "frightened", "afraid", "worried", "anxious", "nervous",
        "concerned", "unsure", "risky", "dangerous", "unsafe", "threat",
        "security issue", "privacy risk", "data breach", "vulnerability",
        "exposed", "leaked", "hack", "hacked",
    ],
    "surprise": [
        "surprised", "shocked", "unexpected", "unbelievable", "incredible",
        "wow", "amazing", "astonished", "stunned", "blown away",
        "did not expect", "no way", "can't believe", "mind blowing",
    ],
    "disgust": [
        "disgusting", "gross", "revolting", "repulsive", "nasty", "vile",
        "repellent", "unpleasant", "off-putting", "sickening", "yuck",
        "low quality", "substandard", "shoddy", "cheap feeling",
    ],
    "trust": [
        "reliable", "trustworthy", "honest", "dependable", "consistent",
        "transparent", "authentic", "genuine", "credible", "reputable",
        "solid", "stable", "confident", "professional", "responsive",
        "fast shipping", "on time", "as described", "as expected",
        "exactly as shown", "highly satisfied", "would buy again",
    ],
    "anticipation": [
        "excited for", "looking forward", "can't wait", "hoping",
        "expect", "expecting", "anticipate", "awaiting", "eager",
        "wish it would", "soon", "upcoming", "promised", "will be",
        "plan to", "intend to", "curious",
    ],
}

# Negation words that can flip an emotion signal
NEGATIONS = {"not", "no", "never", "neither", "barely", "hardly", "don't",
             "doesn't", "didn't", "won't", "can't", "isn't", "wasn't",
             "aren't", "weren't", "haven't", "hasn't", "hadn't"}

# Intensity modifiers that boost a score
INTENSIFIERS = {"very", "extremely", "incredibly", "really", "so", "super",
                "absolutely", "completely", "totally", "utterly", "quite",
                "deeply", "truly", "exceptionally"}


def _tokenise(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def detect_emotion(text: str) -> Tuple[str, Dict[str, float]]:
    """
    Detect the primary emotion from text and return a distribution.

    Returns:
        (primary_emotion, distribution_dict)
        where distribution values sum to ~1.0
    """
    tokens = _tokenise(text)
    token_set = set(tokens)
    text_lower = text.lower()

    raw_scores: Dict[str, float] = {e: 0.0 for e in EMOTION_LEXICONS}

    # Check for negation context in sliding window (3-word context)
    for emotion, keywords in EMOTION_LEXICONS.items():
        # Sort keywords by length (longest phrase first — greedy match)
        for kw in sorted(keywords, key=len, reverse=True):
            if kw in text_lower:
                idx = text_lower.find(kw)
                # Extract up to 3 tokens before keyword to check for negation
                preceding = text_lower[max(0, idx - 20): idx]
                preceding_words = set(re.findall(r"\b\w+\b", preceding))

                if preceding_words & NEGATIONS:
                    # Negated — subtract a small amount from this emotion
                    raw_scores[emotion] -= 0.4
                else:
                    boost = 1.5 if preceding_words & INTENSIFIERS else 1.0
                    raw_scores[emotion] += boost

    # Clamp negatives to 0
    raw_scores = {e: max(0.0, v) for e, v in raw_scores.items()}

    total = sum(raw_scores.values())

    if total == 0.0:
        # No signals — default to neutral/trust as baseline
        return "neutral", {e: round(1.0 / len(EMOTION_LEXICONS), 3) for e in EMOTION_LEXICONS}

    # Normalise to probability distribution
    distribution = {e: round(v / total, 3) for e, v in raw_scores.items()}

    # Pick the highest-scoring emotion
    primary = max(distribution, key=lambda e: distribution[e])

    return primary, distribution
