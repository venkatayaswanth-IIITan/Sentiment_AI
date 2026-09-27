const { Router } = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getForecast } = require('../services/forecastService');

const router = Router();
router.use(authenticateToken);

// GET /api/forecast?days=30
router.get('/', async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
    const data = await getForecast(req.user.id, days);
    return res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
