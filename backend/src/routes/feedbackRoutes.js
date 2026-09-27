const { Router } = require('express');
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(authenticateToken);

// POST /api/feedback — submit a label correction (human-in-the-loop)
router.post('/', async (req, res, next) => {
  try {
    const { analysisId, correctedLabel } = req.body;
    if (!analysisId || !correctedLabel) {
      return res.status(400).json({ error: 'analysisId and correctedLabel are required' });
    }
    if (!['positive', 'negative', 'neutral'].includes(correctedLabel)) {
      return res.status(400).json({ error: 'correctedLabel must be positive | negative | neutral' });
    }

    // Verify the analysis belongs to the user
    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId: req.user.id },
      select: { id: true, sentiment: true },
    });
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Upsert — one correction per analysis
    const existing = await prisma.customerFeedback.findFirst({
      where: { analysisId, userId: req.user.id },
    });

    let feedback;
    if (existing) {
      feedback = await prisma.customerFeedback.update({
        where: { id: existing.id },
        data: { correctedLabel },
      });
    } else {
      feedback = await prisma.customerFeedback.create({
        data: {
          analysisId,
          userId: req.user.id,
          originalLabel: analysis.sentiment,
          correctedLabel,
        },
      });
    }

    return res.status(201).json(feedback);
  } catch (err) { next(err); }
});

// GET /api/feedback — list user's feedback
router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.customerFeedback.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ items, total: items.length });
  } catch (err) { next(err); }
});

module.exports = router;
