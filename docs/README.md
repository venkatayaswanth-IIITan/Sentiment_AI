# BrandPulse AI — Technical Documentation & Features Guide

Welcome to the technical documentation for **BrandPulse AI**, an end-to-end brand sentiment analysis and aspect-based monitoring platform.

---

## 🏛️ System Architecture

```
BrandPulse AI
├── Frontend: React 18 + Vite + Framer Motion + Glassmorphism UI
├── Backend: Node.js + Express + Prisma ORM
├── ML Service: FastAPI + Scikit-Learn (TF-IDF Vectorizer + Pipelines)
├── Database: SQLite (local dev) / PostgreSQL (production docker)
└── Deployment: Multi-container Docker & Docker Compose
```

---

## 🌟 Feature Breakdown

### 1. 🧠 Machine Learning & Inference Service (`/ml-service`)

- **High-Throughput FastAPI Server:** Asynchronous REST server running on port `8000`.
- **Pre-Trained Pipeline (`logistic_regression.joblib`):**
  - **Dataset:** 1.6 Million tweets from Sentiment140.
  - **Vectorization:** TF-IDF n-gram range `(1, 2)` capturing contextual phrases and sentiment-bearing modifiers.
  - **Preprocessing:** Normalization, lowercase conversion, URL removal, handle/hashtag stripping, and punctuation cleansing.
  - **Probabilities & Confidence:** Returns calibrated positive and negative probabilities via sigmoid decision functions.
- **Multi-Model Registry:**
  - `logistic_regression` (default end-to-end pipeline)
  - `linear_svc` (Linear Support Vector Classification)
  - `naive_bayes` (Multinomial Naive Bayes)
  - `xgboost` (Extreme Gradient Boosting)
- **Zero-Downtime Fallback Predictor:** If an untrained model is invoked or unexpected input is received, a keyword heuristic guarantees a valid response without HTTP 500 crashes.
- **Aspect-Based Sentiment Extraction (ABSA):** Identifies domain-specific aspects and pairs them with sentiment scores.

---

### 2. ⚡ Backend REST API (`/backend`)

- **RESTful Endpoints & Separation of Concerns:**
  - `/api/auth`: User registration, JWT login, and profile validation.
  - `/api/analyses`: Single text prediction, database persistence, summary KPI calculations, and paginated history.
  - `/api/reports`:
    - **CSV Bulk Import:** Upload up to 500 rows per CSV to run batch sentiment scoring.
    - **CSV Export:** Download full user analysis history.
  - `/api/brands`: Manage custom brand keywords and monitoring tags.
  - `/api/alerts`: Triggers alerts on high negative volume (e.g. ≥50% negative feedback in a batch).
- **Security & Reliability:**
  - **Authentication:** JWT tokens signed with HMAC-SHA256 and bcrypt-hashed user passwords.
  - **Rate Limiting:** Protects `/api/auth` against brute force and general routes against DDoS.
  - **Security Headers:** Enforced via `helmet`.
  - **CORS Protection:** Configured to whitelist allowed origins.
- **Prisma ORM & Models:**
  - `User`: User profiles and authentication metadata.
  - `Session`: Token session tracking.
  - `Analysis`: Sentiment history, model version, sentiment label, and confidence score.
  - `UserBrand`: Custom brand keywords.
  - `Alert`: System and sentiment spike notifications.

---

### 3. 🎨 Modern Frontend Dashboard (`/frontend`)

- **Landing Page & Marketing Experience:**
  - **Hero Section:** Interactive live prediction preview sandbox.
  - **Live Ticker:** Real-time ticker tape showing incoming brand sentiments.
  - **Architecture Visualizer:** Interactive tabs showing TF-IDF vectorization, Sigmoid curves, and sub-15ms inference latency.
  - **Feature Grid & FAQ:** Animated accordions and feature cards with custom hover glows.
- **User Dashboard (`/dashboard/*`):**
  - **Dashboard Overview:** KPI metrics (Total Analyses, Positive %, Negative %, Avg Confidence), recent items feed, and status indicators.
  - **Live Analyzer Page:** Interactive input area with character count, model picker, live probability bars, and instant classification.
  - **Analytics Page:** Volume breakdown and distribution statistics.
  - **Reports Page:** Drag-and-drop CSV batch upload with summary metrics and one-click CSV export.
  - **History Page:** Paginated table with search query filter, sentiment badge filters, and record deletion.
  - **Alerts Page:** Notification center showing negative sentiment spike alerts with unread badge counters.
  - **Settings Page:** User profile overview, brand keyword monitor manager, and appearance settings.
- **Design System & Aesthetics:**
  - Glassmorphic translucent cards with subtle border gradients.
  - Dark Mode, Light Mode, and System Theme synchronization.
  - 4 customizable accent themes: **Violet**, **Blue**, **Emerald**, and **Rose**.
  - Smooth micro-interactions powered by Framer Motion.

---

## 🛠️ Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express backend listening port | `5000` |
| `DATABASE_URL` | Prisma database connection string | `file:./prisma/prisma/dev.db` |
| `JWT_SECRET` | Secret key for JWT signing | `brandpulse_jwt_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration lifespan | `7d` |
| `ML_SERVICE_URL` | URL of the Python FastAPI microservice | `http://127.0.0.1:8000` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `VITE_API_URL` | Backend URL used by frontend API client | `http://localhost:5000/api` |
