const { Router } = require('express');
const axios = require('axios');
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();

// All analysis routes require authentication
router.use(authenticateToken);

const ALLOWED_MODELS = [
  'cnn_bilstm',
  'logistic_regression',
  'xgboost', // backward compat -> auto-mapped to cnn_bilstm
];

// POST /api/analyses — run sentiment analysis and persist result
router.post('/', async (req, res, next) => {
  try {
    let { text, model = 'cnn_bilstm' } = req.body;

    if (model === 'xgboost' || model === 'bilstm' || model === 'cnn') {
      model = 'cnn_bilstm';
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: 'text must be ≤ 10 000 characters' });
    }

    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ error: `model must be one of: cnn_bilstm, logistic_regression` });
    }

    const { analyzeSentiment } = require('../services/nlpSentimentAnalyzer');
    const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

    // ── Call sentiment prediction ────────────────────────────────────────────
    let prediction = null;
    try {
      const res = await axios.post(
        `${ML_URL}/predict`,
        { text: text.trim(), model },
        { timeout: 8000 }
      );
      prediction = res.data;
    } catch (mlErr) {
      console.warn('[analysisRoutes] ML service unreachable, using calibrated NLP fallback:', mlErr.message);
      prediction = analyzeSentiment(text.trim());
    }

    const sentiment    = (prediction.sentiment || '').toLowerCase();
    const label        = prediction.label ?? (sentiment === 'positive' ? 1 : 0);
    const confidence   = prediction.confidence ?? (prediction.positive_probability ? Math.max(prediction.positive_probability, prediction.negative_probability) / 100 : 0.75);
    const resolvedModel = prediction.model || model;

    // ── Call intelligence pipeline (non-blocking — fallback gracefully) ──────
    let emotion = 'neutral';
    let intent  = 'general_feedback';
    let aspects = '[]';
    let priorityScore = 0.0;
    let riskLevel = 'low';

    try {
      const { data: intel } = await axios.post(
        `${ML_URL}/intelligence`,
        { text: text.trim() },
        { timeout: 15000 }
      );
      emotion       = intel.emotion       || 'neutral';
      intent        = intel.intent        || 'general_feedback';
      aspects       = JSON.stringify(intel.aspects || []);
      priorityScore = intel.priority_score ?? 0.0;
      riskLevel     = intel.risk_level    || 'low';
    } catch (intelErr) {
      // Intelligence call failed — log but don't fail the whole request
      console.warn('[analysisRoutes] Intelligence call failed:', intelErr.message);
    }

    const saved = await prisma.analysis.create({
      data: {
        userId: req.user.id,
        text: text.trim(),
        model: resolvedModel,
        sentiment,
        label,
        confidence,
        emotion,
        intent,
        aspects,
        priorityScore,
        riskLevel,
      },
    });

    return res.status(201).json(saved);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({ error: 'ML service unavailable' });
    }
    if (err.response) {
      return res.status(502).json({ error: 'ML prediction failed', detail: err.response.data });
    }
    next(err);
  }
});


// GET /api/analyses — paginated history for authenticated user
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [items, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.analysis.count({ where: { userId: req.user.id } }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses/summary — aggregate stats for dashboard
router.get('/summary', async (req, res, next) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { userId: req.user.id },
      select: { sentiment: true, confidence: true },
    });

    const total = analyses.length;
    const positive = analyses.filter((a) => a.sentiment === 'positive').length;
    const negative = analyses.filter((a) => a.sentiment === 'negative').length;

    const confScores = analyses
      .map((a) => a.confidence)
      .filter((c) => c !== null && c !== undefined);
    const avgConfidence = confScores.length
      ? confScores.reduce((s, v) => s + v, 0) / confScores.length
      : 0;

    return res.json({
      total,
      positive,
      negative,
      positivePercentage: total ? Number(((positive / total) * 100).toFixed(1)) : 0,
      negativePercentage: total ? Number(((negative / total) * 100).toFixed(1)) : 0,
      avgConfidence: Number((avgConfidence * 100).toFixed(1)),
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/analyses/:id — delete a single analysis (owned by user)
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.analysis.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
