/**
 * chatbotRoutes.js — PulseBot AI Copilot Q&A
 * Features:
 * - Answers ANY question (not restricted)
 * - Queries real Prisma database to verify if data exists or not
 * - Leverages Google Search grounding via Gemini to fetch live, updated internet info
 * - Comprehensive BrandPulse AI architecture & NLP intelligence knowledge
 * POST /api/chatbot/ask
 * GET  /api/chatbot/config
 * POST /api/chatbot/set-key
 * GET  /api/chatbot/topics
 */
const { Router } = require('express');
const prisma = require('../config/db');
const { callGeminiApi, isGeminiConfigured, saveGeminiApiKey, getActiveKey } = require('../services/geminiService');

const router = Router();

/* ── Embedded Knowledge Base (for fallback and context) ───────────────────── */
const KB = {
  overview: 'BrandPulse AI is a production-ready brand intelligence and sentiment monitoring platform. It has 3 microservices: React 18 + Vite frontend (port 5173), Node.js + Express backend (port 5000), and Python FastAPI ML service (port 8000). It analyzes public sentiment, monitors brand health, and auto-alerts when negative feedback spikes above 50%.',
  ml_models: '2 ML models are supported: CNN + BiLSTM (primary deep learning model, 82.56% accuracy on Sentiment140, Conv1D + Bidirectional LSTM architecture) and Logistic Regression (secondary baseline, 77.85% accuracy, TF-IDF). Stored in ml-service/artifacts/.',
  dataset: 'Sentiment140 dataset: 1.6 million tweets. Labels: 0=negative, 4=positive. File path: ml-service/data/training.1600000.processed.noemoticon.csv. Columns: sentiment, id, date, query, user, text. Default SAMPLE_SIZE=200000 for dev speed.',
  preprocessing: 'clean_text() performs: lowercase, remove URLs, remove @mentions and #hashtags, strip HTML tags, strip whitespace. tokenize_and_lemmatize() adds NLTK WordNetLemmatizer + stopword removal with graceful fallback when NLTK is unavailable.',
  absa: '10 predefined brand aspects in aspects.py: pricing, customer_service, quality, performance, usability, delivery, reliability, features, value_for_money, brand_reputation. Each uses keyword matching with 25-char negation window and 1.5x intensifier multiplier.',
  emotion: '8 emotion classes: joy, anger, sadness, fear, surprise, disgust, trust, anticipation. Rule-based lexicon with 3-word negation context window. Returns neutral + uniform distribution when no signals found.',
  intelligence: 'POST /intelligence pipeline: emotion detection + intent classification + ABSA. Priority score: +0.5+conf*0.2 for urgent intents {complaint,refund_request,urgency}; +dist*0.3 for urgent emotions {anger,disgust,fear}; +0.05 per negative aspect (max 0.2). Risk: critical>=0.75, high>=0.5, medium>=0.25, else low.',
  backend_api: 'Express.js on port 5000. Security: Helmet, strict CORS, rate limiting (auth: 20req/15min, api: 300req/15min), 1MB body limit. Key routes: POST /api/auth/signup, POST /api/auth/signin, POST /api/analyses, GET /api/analyses, GET /api/analyses/summary, DELETE /api/analyses/:id.',
  reports: 'POST /api/reports/import: CSV batch upload, max 500 rows, 2MB file, requires "text" column. Auto-triggers a negative_spike alert when >=50% rows are negative. GET /api/reports/export: downloads full analysis history as CSV.',
  auth: 'JWT (jsonwebtoken) + bcrypt (salt=10). Session record stored in DB. Signout deletes session for server-side invalidation. JWT payload: {userId, email, role}, default 7d expiry. Frontend stores token in localStorage key "brandpulse_token". DiceBear bottts avatar auto-generated on signup.',
  database: 'Prisma ORM, 11 models: User, Session, Brand, Sentiment, AspectMetric, Analysis, UserBrand, Alert, AIInsight, CustomerFeedback, ModelVersion. All IDs are UUIDs. Local dev uses SQLite, Docker uses PostgreSQL.',
  docker: '4 Docker Compose services: postgres:16-alpine, ml-service, backend (Express), frontend (Nginx on port 3000). Startup order: database->ml-service->backend->frontend. Volume mounted ML artifacts.',
  frontend: 'React 18 + Vite. Dashboard pages: Overview, Live Analyzer, Analytics, Batch Reports, History, Alerts, Settings. Theme: Dark/Light/System + 4 accent palettes (Violet, Blue, Emerald, Rose). Framer Motion micro-animations, Lucide React icons.',
  gemini: 'Gemini API model fallback order: gemini-flash-lite-latest -> gemini-2.5-flash -> gemini-3.8-flash -> gemini-pro-latest. Features live Google Search grounding for real-time web facts and executive insight synthesis.',
  startup: 'ML Service: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` | Backend: `cd backend && npm run dev` | Frontend: `cd frontend && npm run dev` | All-in-one: `docker-compose up --build`',
  security: 'Security layers: Helmet HTTP headers, strict CORS, rate limiting, 1MB JSON body limit. Uniform error messages for authentication.',
};

/**
 * Check the real database to verify whether requested data actually exists
 */
async function inspectDatabase(query) {
  try {
    const q = (query || '').toLowerCase();
    const [totalAnalyses, totalBrands, totalUsers, positiveCount, negativeCount] = await Promise.all([
      prisma.analysis.count(),
      prisma.userBrand.count(),
      prisma.user.count(),
      prisma.analysis.count({ where: { sentiment: 'positive' } }),
      prisma.analysis.count({ where: { sentiment: 'negative' } }),
    ]);

    // Extract potential query terms (stripping common stopwords)
    const stopWords = new Set([
      'what', 'is', 'the', 'there', 'in', 'are', 'and', 'for', 'any', 'our', 'my',
      'how', 'many', 'does', 'data', 'database', 'system', 'check', 'show', 'tell',
      'me', 'about', 'with', 'from', 'have', 'we', 'like', 'this', 'that', 'or', 'not',
      'can', 'you', 'give', 'some', 'please', 'know', 'if', 'exist', 'record', 'records'
    ]);
    const words = q.replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w));

    let matchingAnalyses = [];
    let matchingBrands = [];
    let matchedTerm = null;

    for (const word of words) {
      const analyses = await prisma.analysis.findMany({
        where: { text: { contains: word } },
        select: { text: true, sentiment: true, emotion: true, intent: true, confidence: true, createdAt: true },
        take: 4,
        orderBy: { createdAt: 'desc' }
      });
      if (analyses.length > 0) {
        matchingAnalyses = analyses;
        matchedTerm = word;
        break;
      }
    }

    for (const word of words) {
      const brands = await prisma.userBrand.findMany({
        where: {
          OR: [
            { name: { contains: word } },
            { keywords: { contains: word } }
          ]
        },
        take: 3
      });
      if (brands.length > 0) {
        matchingBrands = brands;
        if (!matchedTerm) matchedTerm = word;
        break;
      }
    }

    // Recent sample feedback from DB for general awareness
    const recentSample = await prisma.analysis.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { text: true, sentiment: true, emotion: true, intent: true }
    });

    return {
      totalAnalyses,
      totalBrands,
      totalUsers,
      positiveCount,
      negativeCount,
      matchedTerm,
      matchingAnalyses,
      matchingBrands,
      recentSample,
      hasSpecificMatch: matchingAnalyses.length > 0 || matchingBrands.length > 0,
      checkedQueryWords: words
    };
  } catch (err) {
    console.warn('[PulseBot] DB inspection warning:', err.message);
    return null;
  }
}

/* ── Route handlers ─────────────────────────────────────────────────────── */

// GET /api/chatbot/config - check Gemini status
router.get('/config', (req, res) => {
  const configured = isGeminiConfigured();
  const rawKey = getActiveKey();
  const masked = rawKey && rawKey.length > 8
    ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
    : (configured ? '••••••••••••' : null);

  res.json({
    is_gemini_active: configured,
    masked_key: masked,
    provider: 'Google Gemini (with Live Web Search & DB Grounding)'
  });
});

// POST /api/chatbot/set-key - store Gemini API key
router.post('/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return res.status(400).json({ error: 'Please provide a valid Gemini API key.' });
  }

  const result = saveGeminiApiKey(apiKey.trim());
  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to save API key' });
  }

  res.json({
    success: true,
    message: 'Gemini API key saved and activated for PulseBot!',
    is_gemini_active: true
  });
});

// POST /api/chatbot/ask - answers ANY question, checks real database, and searches internet
router.post('/ask', async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > 1500) {
      return res.status(400).json({ error: 'message must be <= 1500 characters' });
    }

    const q = message.trim();
    const customKey = (apiKey || req.headers['x-gemini-api-key'] || '').trim() || null;

    // 1. Inspect real database records
    const dbInfo = await inspectDatabase(q);

    // 2. Format database context string for the AI prompt
    let dbContextStr = `Current System Database State:
- Total Customer Analyses: ${dbInfo ? dbInfo.totalAnalyses : 'N/A'}
- Positive Analyses: ${dbInfo ? dbInfo.positiveCount : 'N/A'}
- Negative Analyses: ${dbInfo ? dbInfo.negativeCount : 'N/A'}
- Monitored Brands: ${dbInfo ? dbInfo.totalBrands : 'N/A'}
- Registered Users: ${dbInfo ? dbInfo.totalUsers : 'N/A'}`;

    if (dbInfo?.hasSpecificMatch) {
      if (dbInfo.matchingAnalyses.length > 0) {
        dbContextStr += `\n- FOUND MATCHING ANALYSES for term "${dbInfo.matchedTerm}":\n` +
          dbInfo.matchingAnalyses.map(a => `  • "${a.text}" (Sentiment: ${a.sentiment}, Emotion: ${a.emotion || 'N/A'}, Intent: ${a.intent || 'N/A'})`).join('\n');
      }
      if (dbInfo.matchingBrands.length > 0) {
        dbContextStr += `\n- FOUND MONITORED BRANDS for term "${dbInfo.matchedTerm}":\n` +
          dbInfo.matchingBrands.map(b => `  • Brand: ${b.name} (Keywords: ${b.keywords})`).join('\n');
      }
    } else if (dbInfo && dbInfo.checkedQueryWords.length > 0) {
      dbContextStr += `\n- Specific search for terms [${dbInfo.checkedQueryWords.join(', ')}]: NO MATCHING RECORDS found in local analyses/brands.`;
    }

    // 3. Prepare Comprehensive System Prompt
    const SYSTEM_PROMPT = `You are PulseBot, the advanced, highly helpful AI Copilot for BrandPulse AI.
You have three core capabilities:
1. REAL LOCAL DATABASE VERIFICATION: You know the exact state of the local database provided below. If the user asks whether certain data, feedback, or brands exist or are recorded, give an honest and precise answer based on the verified database context (quote matching samples if found, or clearly inform them if no matching records exist).
2. LIVE INTERNET SEARCH GROUNDING: For real-world questions, current events, latest tech/AI news, market information, or external company sentiment, you utilize Google Search grounding to provide accurate, updated, real-time information.
3. BRANDPULSE AI KNOWLEDGE: Deep expertise in the platform architecture (FastAPI port 8000, Express port 5000, Vite React port 5173), ML models (CNN + BiLSTM as primary at 82.56% accuracy, Logistic Regression as secondary at 77.85% accuracy), ABSA (10 predefined aspects), emotion/intent classification, Docker, and Prisma DB.

DIRECTIVES:
- Answer ANY question the user asks. Never refuse or say a question is out of scope.
- If asked "is the data there or not", look at the REAL LOCAL DATABASE CONTEXT below and confirm whether it is present or not.
- For real-world or internet-based topics, provide updated facts with clear details.
- Format responses in clean Markdown (headings, bullet points, and code backticks where appropriate).
- Be polite, insightful, and articulate.`;

    const prompt = `USER QUESTION:
${q}

REAL LOCAL DATABASE CONTEXT:
${dbContextStr}

PROJECT CORE FACTS:
${Object.entries(KB).map(([k, v]) => `[${k}]: ${v}`).join('\n')}

Please provide a comprehensive, direct, and well-structured answer.`;

    // 4. Call Gemini LLM with Google Search Grounding enabled
    if (customKey || isGeminiConfigured()) {
      try {
        const { text, modelUsed, sources } = await callGeminiApi(prompt, SYSTEM_PROMPT, customKey, false, true);
        if (text && text.trim()) {
          return res.json({
            answer: text.trim(),
            related: true,
            source: sources && sources.length > 0 ? 'internet_grounded' : 'gemini_ai',
            model: modelUsed,
            sources: sources || [],
            db_checked: Boolean(dbInfo),
            db_match: dbInfo?.hasSpecificMatch || false,
            db_stats: dbInfo ? {
              total: dbInfo.totalAnalyses,
              positive: dbInfo.positiveCount,
              negative: dbInfo.negativeCount
            } : null
          });
        }
      } catch (ge) {
        console.warn('[PulseBot] Gemini search grounding call failed, falling back:', ge.message);
      }
    }

    // 5. Intelligent Fallback (if Gemini key unavailable or temporary network drop)
    let fallbackAnswer = '';
    const lower = q.toLowerCase();

    if (/data|database|is.*there|exist|record|sample|how many|count/.test(lower) && dbInfo) {
      if (dbInfo.hasSpecificMatch) {
        fallbackAnswer = `### Database Verification Result: Data Found ✅\n\nYes! We checked the live database and found matching records:\n\n` +
          (dbInfo.matchingAnalyses.length > 0 ? `**Matching Analyses:**\n` + dbInfo.matchingAnalyses.map(a => `- "${a.text}" (*${a.sentiment}*)`).join('\n') + `\n\n` : '') +
          (dbInfo.matchingBrands.length > 0 ? `**Matching Monitored Brands:**\n` + dbInfo.matchingBrands.map(b => `- **${b.name}** (Keywords: ${b.keywords})`).join('\n') + `\n\n` : '') +
          `*Current Database Totals: ${dbInfo.totalAnalyses} analyses, ${dbInfo.totalBrands} brands monitored.*`;
      } else {
        fallbackAnswer = `### Database Verification Result ℹ️\n\nWe checked the database: **No specific matching records found** for your query terms.\n\n**Current System Database Overview:**\n- **Total Customer Analyses:** ${dbInfo.totalAnalyses}\n- **Positive Feedback:** ${dbInfo.positiveCount}\n- **Negative Feedback:** ${dbInfo.negativeCount}\n- **Monitored Brands:** ${dbInfo.totalBrands}\n\nYou can add new customer feedback in the **Live Analyzer** or import CSV records in **Batch Reports**.`;
      }
    } else {
      // Local KB lookup
      for (const [key, val] of Object.entries(KB)) {
        if (lower.includes(key.replace('_', ' '))) {
          fallbackAnswer = val;
          break;
        }
      }
      if (!fallbackAnswer) {
        fallbackAnswer = `### AI Copilot Response\n\nI can answer any question about **BrandPulse AI**, check if data is recorded in the **live database** (${dbInfo ? dbInfo.totalAnalyses : 0} analyses present), or search for **updated real-world internet information**.\n\nPlease ensure the Gemini API key is configured in settings or .env to enable real-time internet search grounding!`;
      }
    }

    return res.json({
      answer: fallbackAnswer,
      related: true,
      source: 'local_db',
      model: 'Local DB & Knowledge Engine',
      sources: [],
      db_checked: Boolean(dbInfo),
      db_match: dbInfo?.hasSpecificMatch || false,
    });

  } catch (err) {
    console.error('[PulseBot] Error:', err.message);
    res.status(500).json({ error: 'Chatbot service error: ' + err.message });
  }
});

router.get('/topics', (_req, res) => {
  res.json({ topics: Object.keys(KB) });
});

module.exports = router;
