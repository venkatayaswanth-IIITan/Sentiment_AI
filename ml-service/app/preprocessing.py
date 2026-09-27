import re
import string
from typing import List

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import WordNetLemmatizer
    STOP_WORDS = set(stopwords.words("english"))
    LEMMATIZER = WordNetLemmatizer()
except Exception:
    STOP_WORDS = set()
    LEMMATIZER = None

def clean_text(text: str) -> str:
    """Cleans raw text by removing URLs, mentions, emojis, and standardizing punctuation."""
    if not isinstance(text, str):
        return ""
    # Lowercase
    text = text.lower()
    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    # Remove mentions and hashtags
    text = re.sub(r"[@#]\w+", "", text)
    # Remove HTML tags
    text = re.sub(r"<.*?>", "", text)
    # Remove excess whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokenize_and_lemmatize(text: str) -> List[str]:
    """Tokenizes text, strips stopwords and applies lemmatization."""
    cleaned = clean_text(text)
    # Remove punctuation
    cleaned = cleaned.translate(str.maketrans("", "", string.punctuation))
    
    tokens = cleaned.split()
    if LEMMATIZER:
        tokens = [LEMMATIZER.lemmatize(tok) for tok in tokens if tok not in STOP_WORDS]
    else:
        tokens = [tok for tok in tokens if tok not in STOP_WORDS]
    return tokens
