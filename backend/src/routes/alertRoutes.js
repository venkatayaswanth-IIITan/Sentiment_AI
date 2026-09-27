const { Router } = require('express');
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(authenticateToken);

// GET /api/alerts — list user's alerts (newest first, max 100)
router.get('/', async (req, res, next) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts — create an alert (custom rule, webhook simulation, or test trigger)
router.post('/', async (req, res, next) => {
  try {
    const { title, message, type = 'negative_spike' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const alert = await prisma.alert.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        message: message.trim(),
        type: type.trim(),
        read: false,
      },
    });

    return res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/read-all — mark all user alerts as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.alert.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/clear-read — delete all read alerts
router.delete('/clear-read', async (req, res, next) => {
  try {
    await prisma.alert.deleteMany({
      where: { userId: req.user.id, read: true },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/read — mark a single alert as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await prisma.alert.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { read: true },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id — dismiss / delete an alert
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.alert.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
