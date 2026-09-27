"""
aspects.py — Aspect-Based Sentiment Analysis (ABSA)
Detects 10 brand-relevant aspects in text and assigns per-aspect
sentiment (POSITIVE/NEGATIVE/NEUTRAL) with confidence scores.
Uses keyword matching + contextual polarity cues.
"""
from __future__ import annotations
import re
from typing import List, Dict, Any

# ---------------------------------------------------------------------------
# Aspect definitions — keywords that signal the aspect is present
# ---------------------------------------------------------------------------
PREDEFINED_ASPECTS: Dict[str, list[str]] = {
    "pricing": [
        "price", "cost", "expensive", "cheap", "affordable", "value",
        "subscription", "fee", "charge", "overpriced", "worth the money",
        "money", "budget", "dollar", "saving", "discount", "deal",
    ],
    "customer_service": [
        "support", "agent", "service", "help", "response", "representative",
        "staff", "team", "customer care", "helpline", "chat support",
        "email support", "phone support", "resolved", "unresolved",
        "wait time", "hold time",
    ],
    "quality": [
        "quality", "durability", "build", "design", "look", "feel",
        "reliable", "well made", "solid", "sturdy", "flimsy", "cheap",
        "material", "finish", "construction", "craftsmanship",
    ],
    "performance": [
        "speed", "fast", "slow", "bug", "crash", "performance", "lag",
        "battery", "responsive", "efficient", "quick", "sluggish",
        "glitch", "freeze", "loading", "boot time", "processing",
    ],
    "usability": [
        "ui", "ux", "interface", "easy", "complex", "intuitive",
        "navigation", "user friendly", "confusing", "simple", "setup",
        "install", "configure", "learning curve", "documentation",
    ],
    "delivery": [
        "delivery", "shipping", "arrived", "package", "dispatch",
        "tracking", "delayed", "on time", "early", "late", "courier",
        "logistics", "dispatch time", "delivery time", "never arrived",
    ],
    "reliability": [
        "reliable", "uptime", "downtime", "outage", "stable", "unstable",
        "consistency", "consistent", "always works", "keeps breaking",
        "frequent issues", "dependable", "trust", "trustworthy",
    ],
    "features": [
        "feature", "function", "capability", "option", "setting",
        "functionality", "missing feature", "feature request", "lacks",
        "wish it had", "add", "built-in", "integration", "plugin",
        "compatibility", "support for",
    ],
    "value_for_money": [
        "value for money", "worth it", "not worth", "overpriced",
        "great deal", "good price", "bang for buck", "cost effective",
        "affordable", "premium price", "justifies", "too expensive for",
        "cheaper alternative",
    ],
    "brand_reputation": [
        "brand", "reputation", "image", "known", "famous", "popular",
        "trusted brand", "well known", "established", "reliable company",
        "corporate", "company culture", "ethics", "social responsibility",
        "reviews online", "rating",
    ],
}

# ---------------------------------------------------------------------------
# Positive / Negative polarity cue sets
# ---------------------------------------------------------------------------
POSITIVE_CUES = {
    "great", "good", "love", "fast", "affordable", "easy", "amazing",
    "best", "responsive", "excellent", "awesome", "wonderful", "fantastic",
    "perfect", "brilliant", "satisfied", "happy", "recommend", "reliable",
    "on time", "as described", "top notch", "worth it", "solid", "sturdy",
    "intuitive", "smooth", "helpful", "professional", "impressed", "superior",
    "outstanding", "exceeds", "exceeded", "prompt",
}

NEGATIVE_CUES = {
    "bad", "slow", "expensive", "hate", "crash", "bug", "worst", "broken",
    "terrible", "poor", "awful", "horrible", "frustrating", "disappointed",
    "defective", "misleading", "scam", "fake", "useless", "never again",
    "pathetic", "unreliable", "flimsy", "complex", "confusing", "late",
    "delayed", "damaged", "missing", "wrong", "issue", "problem", "annoying",
    "avoid", "return", "refund", "downtime", "outage", "unstable",
}

NEGATIONS = {"not", "no", "never", "don't", "doesn't", "didn't", "can't",
             "won't", "isn't", "wasn't", "aren't", "weren't", "hardly",
             "barely", "rarely", "seldom"}

INTENSIFIERS = {"very", "extremely", "incredibly", "really", "super",
                "absolutely", "completely", "totally", "quite", "deeply"}


def _tokenise(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def extract_aspects(text: str) -> List[Dict[str, Any]]:
    """
    Extract aspects present in the text and assign per-aspect sentiment.
    Returns a list of dicts: {aspect, sentiment, confidence, keywords_matched}.
    """
    text_lower = text.lower()
    words = set(_tokenise(text))
    detected: List[Dict[str, Any]] = []

    for aspect, keywords in PREDEFINED_ASPECTS.items():
        matched_kws = [kw for kw in keywords if kw in text_lower]
        if not matched_kws:
            continue

        # Polarity counting with basic negation awareness
        pos_score = 0.0
        neg_score = 0.0

        for cue in POSITIVE_CUES:
            if cue in text_lower:
                idx = text_lower.find(cue)
                pre = text_lower[max(0, idx - 25): idx]
                pre_words = set(re.findall(r"\b\w+\b", pre))
                multiplier = 1.5 if pre_words & INTENSIFIERS else 1.0
                if pre_words & NEGATIONS:
                    neg_score += multiplier
                else:
                    pos_score += multiplier

        for cue in NEGATIVE_CUES:
            if cue in text_lower:
                idx = text_lower.find(cue)
                pre = text_lower[max(0, idx - 25): idx]
                pre_words = set(re.findall(r"\b\w+\b", pre))
                multiplier = 1.5 if pre_words & INTENSIFIERS else 1.0
                if pre_words & NEGATIONS:
                    pos_score += multiplier
                else:
                    neg_score += multiplier

        # Determine aspect sentiment
        if pos_score > 0 and pos_score > neg_score * 1.1:
            sentiment = "POSITIVE"
            conf = round(min(0.95, 0.65 + 0.05 * min(pos_score, 6)), 2)
        elif neg_score > 0 and neg_score > pos_score * 1.1:
            sentiment = "NEGATIVE"
            conf = round(min(0.95, 0.65 + 0.05 * min(neg_score, 6)), 2)
        else:
            sentiment = "NEUTRAL"
            conf = 0.60

        detected.append({
            "aspect": aspect,
            "sentiment": sentiment,
            "confidence": conf,
            "keywords_matched": matched_kws[:5],  # cap for response size
        })

    return detected
