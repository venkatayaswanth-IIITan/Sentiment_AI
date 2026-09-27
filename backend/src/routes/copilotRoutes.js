const { Router } = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { chat } = require('../services/copilotService');

const router = Router();
router.use(authenticateToken);

// POST /api/copilot/chat
// body: { message: string, history?: [{role, content}] }
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'message must be ≤ 2000 characters' });
    }
    const result = await chat(req.user.id, message.trim(), history);
    return res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
