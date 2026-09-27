# BrandPulse AI — End-to-End Sentiment & Aspect Monitoring Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![FastAPI](https://img.shields.io/badge/ML%20Service-FastAPI%20%2B%20Deep%20Learning-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/GenAI-Google%20Gemini%20%2B%20Search-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20%26%20Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**BrandPulse AI** is a production-grade brand intelligence, sentiment monitoring, and executive analytics platform. It unifies high-throughput deep learning inference, natural language emotion and intent detection, aspect-based sentiment analysis (ABSA), predictive trend forecasting, and Google Gemini-powered executive insights into a sleek, responsive React 18 dashboard.

---

## 📑 Table of Contents

- [Core Capabilities](#-core-capabilities)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Machine Learning & Intelligence Engine](#-machine-learning--intelligence-engine)
- [AI Copilot & PulseBot Assistant](#-ai-copilot--pulsebot-assistant)
- [Executive Insights & Forecasting](#-executive-insights--forecasting)
- [Dashboard & UI/UX Design System](#-dashboard--uiux-design-system)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Running with Docker Compose](#-running-with-docker-compose)
- [API Reference](#-api-reference)
- [Environment Configuration](#-environment-configuration)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Contributing & License](#-contributing--license)

---

## 🚀 Core Capabilities

### 1. 🧠 Dual-Model Inference & NLP Intelligence
- **Primary Deep Learning Model (CNN + BiLSTM):** Conv1D n-gram feature extraction coupled with Bidirectional LSTM sequential context weighting (**82.56% benchmark accuracy** on Sentiment140).
- **Secondary Baseline Model (Logistic Regression):** High-speed N-gram (1, 2) TF-IDF feature extraction pipeline (**77.85% benchmark accuracy**).
- **Full AI Intelligence Pipeline (`/intelligence`):**
  - **Emotion Classification (8 Classes):** Joy, anger, sadness, fear, surprise, disgust, trust, and anticipation with negation handling.
  - **Intent Classification (8 Categories):** Compliment, complaint, question, bug report, feature request, churn risk, refund request, and general feedback.
  - **Aspect-Based Sentiment Analysis (10 ABSA Dimensions):** Pricing, customer service, quality, performance, usability, delivery, reliability, features, value for money, and brand reputation.
  - **Dynamic Priority & Risk Scoring:** Computes urgency weights (`low`, `medium`, `high`, `critical`) based on negative aspects, emotional distress, and churn signals.

### 2. 🤖 PulseBot Copilot & Conversational Grounding
- **Database-Grounded Q&A:** Queries live database entities (analyses, brands, alerts, volume, sentiment splits) using Prisma to answer analytical questions with zero hallucinations.
- **Google Search Grounding:** Powered by Google Gemini (`gemini-flash-lite-latest`, `gemini-2.5-flash`, etc.) with Google Search Grounding for live internet updates and broader industry context.
- **Dual Interface:** Accessible both as a dedicated **AI Copilot** workspace and as a floating **PulseBot Widget** available sitewide.

### 3. 📈 Forecasting & Strategic Executive Insights
- **Predictive Sentiment Forecasting:** Projects brand sentiment trajectory over 7 to 90 days with trend direction, momentum scoring, and volatility indicators.
- **Executive Summaries:** Generates board-ready strategic summaries, top operational risks, and proactive recommendations.
- **Dynamic API Key Management:** Add or update custom Google Gemini API keys directly from the UI settings.

### 4. ⚡ Enterprise Backend & Data Pipeline
- **Express REST API:** Layered controller-service architecture with rate limiting, CORS controls, and Helmet HTTP protection.
- **Prisma ORM (SQLite / PostgreSQL):** 11 database models supporting multi-tenant isolation, session invalidation, and full relational integrity.
- **Batch CSV Import & Export:** Bulk analysis of up to 500 rows per CSV upload with automatic negative spike alert detection.
- **Human-in-the-Loop Feedback:** Submit sentiment label corrections directly from the analysis history table to enable active learning.

### 5. 🎨 Modern Reactive UI & Design System
- **11 Dedicated Dashboard Views:** Overview, Live Analyzer, Analytics, Intelligence, Forecast, Insights, Copilot, History, Alerts, Reports, and Settings.
- **Interactive Landing Page:** Live sentiment ticker tape, prediction visualizers, metrics counters, and feature showcases.
- **Adaptive Theming:** Dark mode, Light mode, System default sync, and 4 curated accent palettes: **Violet**, **Blue**, **Emerald**, and **Rose**.

---

## 🏗️ System Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │              React 18 + Vite SPA             │
                                 │   Framer Motion · Lucide Icons · CSS Tokens  │
                                 │        (Landing Page + 11 Dashboard Pages)   │
                                 └──────────────────────┬───────────────────────┘
                                                        │ HTTP / REST
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │            Node.js + Express API             │
                                 │     JWT Auth · Rate Limiting · Prisma ORM    │
                                 └───────┬──────────────────────────────┬───────┘
                                         │                              │
                    ┌────────────────────┴──────────┐                   │
                    ▼                               ▼                   ▼
       ┌─────────────────────────┐     ┌─────────────────────────┐ ┌─────────────────────────┐
       │   SQLite / PostgreSQL   │     │  FastAPI ML Microservice│ │   Google Gemini API     │
       │   11 Relational Models  │     │   CNN + BiLSTM (82.6%)  │ │  (Executive Summaries   │
       │  (Users, Analyses, etc) │     │   Logistic Reg (77.9%)  │ │  & Search Grounding)    │
       └─────────────────────────┘     └─────────────────────────┘ └─────────────────────────┘
```

---

## 📁 Repository Structure

```
Sentiment-AI/
├── backend/                       # Express REST API & Prisma Database
│   ├── prisma/
│   │   ├── schema.prisma          # 11 models: User, Session, Analysis, Alert, Feedback, etc.
│   │   └── migrations/            # Prisma migration history
│   ├── src/
│   │   ├── config/                # Prisma client & database configuration
│   │   ├── controllers/           # Controllers (Auth, Analysis, Sentiment, etc.)
│   │   ├── middleware/            # JWT authentication & error handling
│   │   ├── routes/                # Endpoints (auth, analyses, reports, copilot, insights, etc.)
│   │   ├── services/              # Business logic (Gemini, Copilot, Forecast, Intelligence)
│   │   └── validators/            # Input validation schemas
│   ├── seed_real_data.js          # Realistic data generator for analytics & testing
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                      # React 18 + Vite Dashboard Application
│   ├── src/
│   │   ├── components/            # Hero, Analyzer, PulseBotWidget, Sidebar, Header, etc.
│   │   ├── context/               # AuthContext & ThemeContext (themes & accent palettes)
│   │   ├── pages/                 # 11 Dashboard views + Landing page modules
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── AnalysisPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── IntelligencePage.jsx
│   │   │   ├── ForecastPage.jsx
│   │   │   ├── InsightsPage.jsx
│   │   │   ├── CopilotPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/              # Axios API clients & authentication helpers
│   │   ├── App.jsx                # Root layout & authentication routing
│   │   └── index.css              # Design system tokens, glassmorphism, animations
│   ├── Dockerfile
│   └── package.json
│
├── ml-service/                    # Python FastAPI Machine Learning Service
│   ├── app/
│   │   ├── main.py                # FastAPI endpoints (/predict, /intelligence, /models, /metrics)
│   │   ├── preprocessing.py       # Cleaning, lemmatization, and regex tokenization
│   │   ├── aspects.py             # 10-aspect extraction engine with negation window
│   │   ├── emotion.py             # 8-class emotion detection engine
│   │   ├── intent.py              # 8-class customer intent classification engine
│   │   └── schemas.py             # Pydantic request & response schemas
│   ├── artifacts/                 # Saved model pipelines & performance metrics
│   ├── train.py                   # Sentiment140 multi-classifier training pipeline
│   ├── Dockerfile
│   └── requirements.txt
│
├── docs/                          # Architecture diagrams & specifications
├── docker-compose.yml             # Orchestration for PostgreSQL, ML, Backend, & Frontend
└── README.md
```

---

## 🧠 Machine Learning & Intelligence Engine

The platform operates two core inference models evaluated against the **Sentiment140** benchmark (1.6M tweets):

| Model | Architecture | Role | Benchmark Accuracy | Key Strengths |
| :--- | :--- | :--- | :---: | :--- |
| **CNN + BiLSTM** | Conv1D + Bidirectional LSTM | **Primary** | **82.56%** | Captures phrase n-grams, word order, and context shifts |
| **Logistic Regression** | TF-IDF (1,2 n-grams) | **Secondary** | **77.85%** | Ultra-low latency inference, interpretable weights |

### Intelligence Pipeline Details (`POST /intelligence`)
When text is analyzed through the intelligence suite:
1. **Emotion Engine:** Evaluates text against an 8-emotion lexicon (`joy`, `anger`, `sadness`, `fear`, `surprise`, `disgust`, `trust`, `anticipation`) with a 3-word negation context window.
2. **Intent Engine:** Identifies intent (`complaint`, `refund_request`, `churn_risk`, `bug_report`, `feature_request`, `compliment`, `question`, `general_feedback`).
3. **ABSA Engine:** Detects 10 product aspects, evaluates sentiment per aspect, and applies intensifier multipliers (e.g., *“extremely slow”* increases negative weight).
4. **Risk Calculation:** Priority score computed from intent urgency, negative aspect volume, and emotion severity to flag items requiring immediate human response.

---

## 🤖 AI Copilot & PulseBot Assistant

**PulseBot** provides an interactive conversational assistant available throughout the platform:

- **Zero-Hallucination DB Inspection:** When users ask questions like *"How many complaints did we receive today?"* or *"What is our current positive sentiment percentage?"*, PulseBot inspects real database records before answering.
- **Google Search Grounding:** Integrates Google Gemini API with Search Grounding to provide up-to-date industry context, competitor insights, and public sentiment trends.
- **Embedded Platform Knowledge:** Fallback knowledge base covering system architecture, ML models, endpoints, and data schemas guarantees helpful responses even without external network access.

---

## 🔮 Executive Insights & Forecasting

- **Predictive Forecasting (`/api/forecast`):**
  - Horizon selectable from **7 to 90 days**.
  - Calculates moving sentiment momentum, baseline stability, and projected customer mood.
- **Executive Digest (`/api/insights`):**
  - Synthesizes automated summaries, identifies root causes behind negative trends, and delivers prioritized business actions.
  - Fully supports custom Gemini API keys provided by the user via the UI.

---

## 🎨 Dashboard & UI/UX Design System

The frontend is built with React 18 and vanilla CSS custom properties for optimal performance and flexibility:

- **Color Tokens & Palettes:** 4 curated accent modes:
  - 🟣 **Violet** (Default enterprise royal theme)
  - 🔵 **Blue** (Corporate analytical style)
  - 🟢 **Emerald** (Fresh high-contrast palette)
  - 🔴 **Rose** (Modern dynamic aesthetic)
- **Glassmorphic Components:** Smooth backdrop blur filters, custom scrollbars, and tactile hover interactions.
- **Micro-Animations:** Framer Motion transitions across route changes, chart loads, and notification popups.
- **Compact Layout Mode:** Toggable sidebar collapse and dense table view for high-density monitoring.

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18.0 or higher) & **npm**
- **Python** (v3.10 or higher)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/venkatayaswanth-IIITan/Sentiment-AI.git
cd Sentiment-AI
```

### 3. Start the ML Service
```bash
cd ml-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The ML Service will be active at [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger docs at `/docs`).*

### 4. Start the Express Backend
In a new terminal:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push

# Optional: Seed realistic test data
node seed_real_data.js

npm run dev
```
*The Backend API will run on [http://localhost:5000](http://localhost:5000).*

### 5. Start the React Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*The Frontend will be running at [http://localhost:5173](http://localhost:5173).*

---

## 🐳 Running with Docker Compose

Deploy the complete stack (PostgreSQL, FastAPI, Node.js Backend, and Nginx Frontend) with a single command:

```bash
docker-compose up --build
```

### Service Map:
- **Web Application:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:5000`
- **ML Microservice:** `http://localhost:8000`
- **PostgreSQL Database:** `localhost:5432`

---

## 🌐 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user | No |
| `POST` | `/api/auth/signin` | Sign in and retrieve JWT token | No |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Yes |
| `POST` | `/api/auth/signout` | Invalidate active session | Yes |

### Analysis & Records (`/api/analyses`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/analyses` | Run sentiment analysis and persist result | Yes |
| `GET` | `/api/analyses` | Paginated analysis history with search & filters | Yes |
| `GET` | `/api/analyses/summary` | KPI analytics (total, positive %, negative %) | Yes |
| `DELETE` | `/api/analyses/:id` | Delete an analysis record | Yes |

### AI Intelligence Suite (`/api/intelligence`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/intelligence/emotions` | Emotion frequency distribution across records | Yes |
| `GET` | `/api/intelligence/intents` | Customer intent category breakdown | Yes |
| `GET` | `/api/intelligence/aspects` | Aggregated aspect sentiment scores | Yes |
| `GET` | `/api/intelligence/topics` | Keyword and topic clustering | Yes |
| `GET` | `/api/intelligence/root-cause` | Root causes for negative feedback | Yes |
| `GET` | `/api/intelligence/brand-health`| Comprehensive brand health score | Yes |
| `GET` | `/api/intelligence/crisis` | Real-time crisis signals and urgent alerts | Yes |

### Forecasting & Executive Insights (`/api/forecast`, `/api/insights`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/forecast?days=30` | Projected sentiment forecast (7–90 days) | Yes |
| `GET` | `/api/insights/summary` | Gemini-generated executive summary | Yes |
| `GET` | `/api/insights/recommendations` | Strategic operational recommendations | Yes |
| `GET` | `/api/insights/config` | Gemini key status check | Yes |
| `POST` | `/api/insights/set-key` | Save user-specific Gemini API key | Yes |

### AI Copilot & Chatbot (`/api/chatbot`, `/api/copilot`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/chatbot/ask` | PulseBot Q&A with DB verification & Search Grounding | No/Yes |
| `POST` | `/api/copilot/chat` | AI Copilot conversational analytical chat | Yes |
| `GET` | `/api/chatbot/topics` | Suggested analytical questions and topics | No |

### Feedback, Reports & Brands (`/api/feedback`, `/api/reports`, `/api/brands`, `/api/alerts`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/feedback` | Submit human-in-the-loop label correction | Yes |
| `GET` | `/api/feedback` | Retrieve list of user feedback corrections | Yes |
| `POST` | `/api/reports/import` | Upload CSV for bulk batch sentiment analysis | Yes |
| `GET` | `/api/reports/export` | Download complete analysis history as CSV | Yes |
| `GET` | `/api/brands` | List monitored brand keywords | Yes |
| `POST` | `/api/brands` | Create new brand keyword monitor | Yes |
| `GET` | `/api/alerts` | List detected negative sentiment spike alerts | Yes |

### ML Microservice (`http://127.0.0.1:8000`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/predict` | Direct model inference (`cnn_bilstm` or `logistic_regression`) | No |
| `POST` | `/intelligence` | Comprehensive pipeline: Emotion + Intent + ABSA + Risk | No |
| `GET` | `/models` | List active models and benchmark accuracies | No |
| `GET` | `/metrics` | Accuracy, Precision, Recall, and F1 benchmarks | No |
| `GET` | `/health` | Microservice health check | No |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DATABASE_URL` | SQLite / PostgreSQL connection URL | `file:./prisma/prisma/dev.db` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secure_jwt_secret` |
| `JWT_EXPIRES_IN`| Token lifespan | `7d` |
| `ML_SERVICE_URL`| Target URL of the FastAPI microservice | `http://127.0.0.1:8000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `GEMINI_API_KEY`| (Optional) Default Google Gemini API key | `AIzaSy...` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint for backend API | `http://localhost:5000/api` |

---

## 🧪 Testing & Quality Assurance

### Run Backend Unit & Integration Tests:
```bash
cd backend
npm test
```

### Health Check Endpoints:
```bash
# Backend Health Check
curl http://localhost:5000/api/health

# ML Service Health Check
curl http://localhost:8000/health
```

---

## 🤝 Contributing & License

Contributions, feature requests, and issue reports are welcome! Please open an issue or submit a pull request on the GitHub repository.

This project is licensed under the **MIT License**.
