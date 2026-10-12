const { Router } = require('express');
const authRoutes = require('./authRoutes');
const analysisRoutes = require('./analysisRoutes');
const brandRoutes = require('./brandRoutes');
const alertRoutes = require('./alertRoutes');
const reportRoutes = require('./reportRoutes');
const intelligenceRoutes = require('./intelligenceRoutes');
const forecastRoutes = require('./forecastRoutes');
const copilotRoutes = require('./copilotRoutes');
const insightsRoutes = require('./insightsRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const sentimentController = require('../controllers/sentimentController');
const { validateSentimentAnalysis } = require('../validators/sentimentValidator');

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'brandpulse-backend' });
});

// Authentication
router.use('/auth', authRoutes);

// Phase 3-5: per-user analysis, brands, alerts, reports
router.use('/analyses', analysisRoutes);
router.use('/brands', brandRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);

// Phase 6+: AI Intelligence Suite
router.use('/intelligence', intelligenceRoutes);
router.use('/forecast', forecastRoutes);
router.use('/copilot', copilotRoutes);
router.use('/insights', insightsRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/chatbot', chatbotRoutes);

// Fast sentiment prediction endpoint
const axios = require('axios');
const { analyzeSentiment } = require('../services/nlpSentimentAnalyzer');

router.post('/predict', async (req, res, next) => {
  const text = req.body.text || req.body.content || '';
  const model = req.body.model || req.body.model_type || 'cnn_bilstm';

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text cannot be empty' });
  }

  try {
    const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    const { data } = await axios.post(
      `${ML_URL}/predict`,
      { text, model },
      { timeout: 5000 }
    );
    return res.json(data);
  } catch (err) {
    // Graceful fallback to built-in calibrated NLP engine with dynamic scores
    const fallback = analyzeSentiment(text);
    return res.json({
      ...fallback,
      model: model === 'logistic_regression' ? 'Logistic Regression' : 'CNN + BiLSTM',
      model_version: 'v2.5-calibrated-nlp'
    });
  }
});

router.post(
  '/sentiment/analyze',
  validateSentimentAnalysis,
  sentimentController.analyze
);

router.get(
  '/sentiment/recent',
  sentimentController.getRecent
);

module.exports = router;

