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

// Legacy sentiment endpoints (kept for ML-service direct access)
const axios = require('axios');
router.post('/predict', async (req, res, next) => {
  try {
    const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    const text = req.body.text || req.body.content || '';
    const model = req.body.model || req.body.model_type || 'logistic_regression';

    const { data } = await axios.post(`${ML_URL}/predict`, { text, model }, { timeout: 30000 });
    return res.json(data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
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

