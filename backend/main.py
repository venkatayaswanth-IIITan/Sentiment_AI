import re
import pickle
import sqlite3
import hashlib
import hmac
import base64
import json
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field




# --------------------------------------------------
# 1. INITIALIZE API
# --------------------------------------------------

app = FastAPI(
    title="Twitter Sentiment Analysis API",
    description="Sentiment prediction using Logistic Regression",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# 2. LOAD TRAINED MODEL
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "logistic_regression_model.pkl"
VECTORIZER_PATH = BASE_DIR / "tfidf_vectorizer.pkl"

model = None
tfidf = None

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        tfidf = pickle.load(f)
    print("Successfully loaded Logistic Regression model and TF-IDF vectorizer.")
except Exception as e:
    print(f"Error loading model files: {e}")


# --------------------------------------------------
# 3. REQUEST SCHEMA
# --------------------------------------------------

class TweetRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )


# --------------------------------------------------
# 4. TEXT PREPROCESSING
# --------------------------------------------------

def clean_tweet(tweet: str) -> str:
    tweet = tweet.lower()

    # Remove URLs
    tweet = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        tweet
    )

    # Remove @mentions
    tweet = re.sub(
        r"@\w+",
        " ",
        tweet
    )

    # Remove hashtag symbol, retain its text
    tweet = re.sub(
        r"#(\w+)",
        r"\1",
        tweet
    )

    # Keep letters, digits, and whitespace
    tweet = re.sub(
        r"[^a-z0-9\s]",
        " ",
        tweet
    )

    # Remove extra whitespace
    tweet = re.sub(
        r"\s+",
        " ",
        tweet
    ).strip()

    return tweet


# --------------------------------------------------
# 5. HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Twitter Sentiment Analysis API is running",
        "model": "Logistic Regression",
        "model_loaded": model is not None and tfidf is not None
    }


# --------------------------------------------------
# 6. PREDICT SENTIMENT
# --------------------------------------------------

@app.post("/predict")
def predict_sentiment(request: TweetRequest):
    if model is None or tfidf is None:
        raise HTTPException(
            status_code=500,
            detail="Model or TF-IDF vectorizer not loaded on server."
        )

    cleaned_text = clean_tweet(request.text)

    if not cleaned_text:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid tweet."
        )

    # Convert tweet into TF-IDF features
    tweet_vector = tfidf.transform([cleaned_text])

    # Predict sentiment
    prediction = int(model.predict(tweet_vector)[0])

    # Probability estimates
    probabilities = model.predict_proba(tweet_vector)[0]

    # Map probability by label (handles 0/1 or Sentiment140 0/4)
    class_probabilities = {
        int(label): float(prob)
        for label, prob in zip(
            model.classes_,
            probabilities
        )
    }

    # 1 or 4 is positive in Sentiment140 conventions
    is_positive = (prediction == 1 or prediction == 4)
    positive_prob = class_probabilities.get(1, class_probabilities.get(4, 0.0))
    negative_prob = class_probabilities.get(0, 0.0)

    # If binary and probabilities sum to 1
    if positive_prob == 0.0 and negative_prob > 0.0 and len(model.classes_) == 2:
        positive_prob = 1.0 - negative_prob
    elif negative_prob == 0.0 and positive_prob > 0.0 and len(model.classes_) == 2:
        negative_prob = 1.0 - positive_prob

    sentiment = "Positive" if is_positive else "Negative"

    return {
        "success": True,
        "text": request.text,
        "sentiment": sentiment,
        "prediction": prediction,
        "positive_probability": round(positive_prob * 100, 2),
        "negative_probability": round(negative_prob * 100, 2),
        "model": "Logistic Regression"
    }


# --------------------------------------------------
# 7. DATABASE & AUTHENTICATION
# --------------------------------------------------

DB_PATH = BASE_DIR.parent / "database" / "brandpulse.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

SECRET_KEY = "brandpulse_jwt_secret_key_change_in_production"

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            avatar_url TEXT,
            role TEXT DEFAULT 'USER',
            is_active INTEGER DEFAULT 1,
            is_verified INTEGER DEFAULT 0,
            last_login_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sentiments (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            source TEXT DEFAULT 'web',
            content TEXT NOT NULL,
            sentiment_label TEXT NOT NULL,
            sentiment_score REAL NOT NULL,
            aspects TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        )
    """)
    conn.commit()
    conn.close()

# Initialize tables on startup
init_db()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${key}"


def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        salt, key = stored_password.split('$')
        new_key = hashlib.pbkdf2_hmac(
            'sha256',
            provided_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False


def create_token(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature_raw = hmac.new(
        SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature_raw).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        expected_sig_raw = hmac.new(
            SECRET_KEY.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256
        ).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig_raw).decode().rstrip("=")
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None
        padded_payload = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload_data = json.loads(base64.urlsafe_b64decode(padded_payload).decode())
        
        # Check expiration
        exp = payload_data.get("exp")
        if exp and datetime.now(timezone.utc).timestamp() > exp:
            return None
        return payload_data
    except Exception:
        return None


class SignUpRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)


class SignInRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=100)


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user_id = payload.get("userId")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, avatar_url, role, is_active, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["is_active"]:
        raise HTTPException(status_code=401, detail="User account not found or inactive.")

    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "avatarUrl": row["avatar_url"],
        "role": row["role"],
        "createdAt": row["created_at"]
    }


def handle_signup(req: SignUpRequest, request: Request):
    email = req.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)
    user_name = req.name.strip() if req.name else email.split("@")[0].capitalize()
    avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={user_id}"

    cursor.execute("""
        INSERT INTO users (id, email, password_hash, name, avatar_url, role, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, 'USER', 1, 0)
    """, (user_id, email, pw_hash, user_name, avatar_url))

    # Create session token
    exp_time = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    token = create_token({
        "userId": user_id,
        "email": email,
        "role": "USER",
        "jti": secrets.token_hex(8),
        "exp": exp_time
    })

    session_id = str(uuid.uuid4())
    user_agent = request.headers.get("user-agent", "")
    ip_addr = request.client.host if request.client else ""
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    cursor.execute("""
        INSERT INTO sessions (id, user_id, token, user_agent, ip_address, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, user_id, token, user_agent, ip_addr, expires_at.isoformat()))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": user_name,
            "avatarUrl": avatar_url,
            "role": "USER"
        }
    }


def handle_signin(req: SignInRequest, request: Request):
    email = req.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not verify_password(user["password_hash"], req.password):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user["is_active"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Account has been deactivated.")

    user_id = user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now_iso, user_id))

    # Generate token
    exp_time = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    token = create_token({
        "userId": user_id,
        "email": email,
        "role": user["role"],
        "jti": secrets.token_hex(8),
        "exp": exp_time
    })


    session_id = str(uuid.uuid4())
    user_agent = request.headers.get("user-agent", "")
    ip_addr = request.client.host if request.client else ""
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    cursor.execute("""
        INSERT INTO sessions (id, user_id, token, user_agent, ip_address, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, user_id, token, user_agent, ip_addr, expires_at.isoformat()))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Signed in successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user["name"],
            "avatarUrl": user["avatar_url"],
            "role": user["role"]
        }
    }


# Endpoints with both /auth/... and /api/auth/... to support either routing convention
@app.post("/auth/signup", tags=["Authentication"])
@app.post("/api/auth/signup", tags=["Authentication"])
def signup(req: SignUpRequest, request: Request):
    return handle_signup(req, request)


@app.post("/auth/signin", tags=["Authentication"])
@app.post("/api/auth/signin", tags=["Authentication"])
def signin(req: SignInRequest, request: Request):
    return handle_signin(req, request)


@app.get("/auth/me", tags=["Authentication"])
@app.get("/api/auth/me", tags=["Authentication"])
def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": user
    }


@app.post("/auth/signout", tags=["Authentication"])
@app.post("/api/auth/signout", tags=["Authentication"])
def signout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return {"success": True, "message": "Logged out successfully."}


@app.get("/auth/stats", tags=["Authentication"])
@app.get("/api/auth/stats", tags=["Authentication"])
def get_auth_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS total_users FROM users")
    total_users = cursor.fetchone()["total_users"]
    cursor.execute("SELECT COUNT(*) AS active_sessions FROM sessions WHERE expires_at > ?", (datetime.now(timezone.utc).isoformat(),))
    active_sessions = cursor.fetchone()["active_sessions"]
    conn.close()
    return {
        "total_users": total_users,
        "active_sessions": active_sessions,
        "database": str(DB_PATH.name)
    }

