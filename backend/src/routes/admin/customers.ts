import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = Router();

// GET /admin/customers ?search=&page=&limit=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { role: 'USER' };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /admin/customers/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthday: true,
        emailVerified: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            razorpayPaymentStatus: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    // Compute total spent (only captured payments)
    const totalSpent = await prisma.order.aggregate({
      where: { userId: id, razorpayPaymentStatus: 'captured' },
      _sum: { total: true },
    });
    res.json({
      customer: {
        ...customer,
        totalSpentPaise: totalSpent._sum?.total ?? 0,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
