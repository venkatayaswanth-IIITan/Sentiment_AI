const { Router } = require('express');
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = Router();
router.use(authenticateToken);

// GET /api/brands — list user's tracked brands
router.get('/', async (req, res, next) => {
  try {
    const brands = await prisma.userBrand.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(brands);
  } catch (err) {
    next(err);
  }
});

// POST /api/brands — create a brand keyword tracker
router.post('/', async (req, res, next) => {
  try {
    const { name, keywords } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Brand name is required' });
    }
    if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
      return res.status(400).json({ error: 'Keywords are required' });
    }
    if (name.length > 100 || keywords.length > 1000) {
      return res.status(400).json({ error: 'Name ≤ 100 chars, keywords ≤ 1000 chars' });
    }

    const brand = await prisma.userBrand.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        keywords: keywords.trim(),
      },
    });

    return res.status(201).json(brand);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A brand with this name already exists' });
    }
    next(err);
  }
});

// DELETE /api/brands/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.userBrand.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
