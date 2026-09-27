const { Router } = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getExecutiveSummary } = require('../services/executiveSummaryService');
const { isGeminiConfigured, saveGeminiApiKey, getActiveKey } = require('../services/geminiService');

const router = Router();
router.use(authenticateToken);

// GET /api/insights/config - check if Gemini API key is configured
router.get('/config', (req, res) => {
  const configured = isGeminiConfigured();
  const rawKey = getActiveKey();
  const masked = rawKey && rawKey.length > 8 
    ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`
    : (configured ? '••••••••••••' : null);

  return res.json({
    is_gemini_active: configured,
    masked_key: masked,
    provider: 'Google Gemini'
  });
});

// POST /api/insights/set-key - store user's Gemini API key
router.post('/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a valid Gemini API key.' });
  }

  const result = saveGeminiApiKey(apiKey);
  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to save API key' });
  }

  return res.json({
    success: true,
    message: 'Gemini API key saved and activated successfully!',
    is_gemini_active: true
  });
});

// GET /api/insights/summary
router.get('/summary', async (req, res, next) => {
  try {
    const customKey = req.headers['x-gemini-api-key'] || null;
    const data = await getExecutiveSummary(req.user.id, customKey);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/insights/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const customKey = req.headers['x-gemini-api-key'] || null;
    const summaryData = await getExecutiveSummary(req.user.id, customKey);
    
    return res.json({
      recommendations: summaryData.recommendations || [],
      ai_powered: summaryData.ai_powered || false,
      ai_model: summaryData.ai_model || 'heuristic-engine',
      sentiment_outlook: summaryData.sentiment_outlook || 'stable',
      period: summaryData.period,
    });
  } catch (err) { next(err); }
});

module.exports = router;
