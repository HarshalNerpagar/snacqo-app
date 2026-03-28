import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = Router();

// GET /admin/reviews ?page=&limit=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.orderReview.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          rating: true,
          text: true,
          imageUrls: true,
          videoUrl: true,
          reviewerFirstName: true,
          reviewerLastName: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              items: {
                take: 3,
                select: { productName: true },
              },
            },
          },
        },
      }),
      prisma.orderReview.count(),
    ]);

    res.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// DELETE /admin/reviews/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.orderReview.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
