/**
 * intelligenceRoutes.js
 * GET /api/intelligence/* — all derived from real DB data, nothing fabricated.
 */

const { Router } = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getEmotionDistribution,
  getIntentBreakdown,
  getAspectAggregation,
  getTopics,
  getRootCauses,
  getBrandHealth,
  getCrisisSignals,
} = require('../services/intelligenceService');

const router = Router();
router.use(authenticateToken);

// GET /api/intelligence/emotions
router.get('/emotions', async (req, res, next) => {
  try {
    const data = await getEmotionDistribution(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/intents
router.get('/intents', async (req, res, next) => {
  try {
    const data = await getIntentBreakdown(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/aspects
router.get('/aspects', async (req, res, next) => {
  try {
    const data = await getAspectAggregation(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/topics
router.get('/topics', async (req, res, next) => {
  try {
    const data = await getTopics(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/root-cause
router.get('/root-cause', async (req, res, next) => {
  try {
    const data = await getRootCauses(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/brand-health
router.get('/brand-health', async (req, res, next) => {
  try {
    const data = await getBrandHealth(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

// GET /api/intelligence/crisis
router.get('/crisis', async (req, res, next) => {
  try {
    const data = await getCrisisSignals(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
