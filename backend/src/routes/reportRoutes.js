const { Router } = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(authenticateToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

const ALLOWED_MODELS = [
  'cnn_bilstm',
  'logistic_regression',
  'xgboost',
];

// POST /api/reports/import — bulk analyze a CSV with a "text" column
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    let model = req.body.model || 'cnn_bilstm';
    if (model === 'xgboost' || model === 'bilstm' || model === 'cnn') {
      model = 'cnn_bilstm';
    }
    if (!ALLOWED_MODELS.includes(model)) {
      model = 'cnn_bilstm';
    }

    let rows;
    try {
      rows = parse(req.file.buffer.toString('utf8'), {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true,
      });
    } catch {
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    if (!rows.length) {
      return res.status(400).json({ error: 'CSV contains no data rows' });
    }

    if (rows.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 rows per import' });
    }

    if (!Object.prototype.hasOwnProperty.call(rows[0], 'text')) {
      return res.status(400).json({ error: "CSV must contain a 'text' column" });
    }

    const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
    const validTexts = rows
      .map((r) => String(r.text || '').trim())
      .filter((t) => t.length > 0 && t.length <= 10000);

    let imported = 0;
    let failed = rows.length - validTexts.length;
    let negativeCount = 0;

    for (const text of validTexts) {
      try {
        const { data: prediction } = await axios.post(
          `${ML_URL}/predict`,
          { text, model },
          { timeout: 30000 }
        );

        const sentiment = (prediction.sentiment || '').toLowerCase();
        const label = prediction.label ?? (sentiment === 'positive' ? 1 : 0);

        await prisma.analysis.create({
          data: {
            userId: req.user.id,
            text,
            model: prediction.model || model,
            sentiment,
            label,
            confidence: prediction.confidence ?? null,
          },
        });

        imported++;
        if (sentiment === 'negative') negativeCount++;
      } catch {
        failed++;
      }
    }

    // Create alert if ≥ 50 % of imported rows are negative
    if (imported > 0 && negativeCount / imported >= 0.5) {
      await prisma.alert.create({
        data: {
          userId: req.user.id,
          title: 'Negative sentiment spike detected',
          message: `${negativeCount} of ${imported} imported posts were negative.`,
          type: 'negative_spike',
        },
      });
    }

    return res.json({ imported, failed, negative: negativeCount });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/export — download user's analyses as CSV
router.get('/export', async (req, res, next) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const header = ['id', 'text', 'sentiment', 'model', 'confidence', 'createdAt']
      .map(esc)
      .join(',');

    const rows = analyses.map((a) =>
      [a.id, a.text, a.sentiment, a.model, a.confidence, new Date(a.createdAt).toISOString()]
        .map(esc)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sentiment-report.csv"');
    return res.send([header, ...rows].join('\r\n'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
