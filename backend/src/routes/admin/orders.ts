import { Router } from 'express';
import { type OrderStatus } from '@prisma/client';
import { requireAdmin } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = Router();

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const orderInclude = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          product: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  },
  campus: { select: { id: true, name: true, line1: true, city: true, state: true, pincode: true } },
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
};

// GET /admin/orders ?status=&paymentStatus=&search=&hideUnpaid=true&page=&limit=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : undefined;
    const paymentStatus = typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim().toLowerCase() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const hideUnpaid = req.query.hideUnpaid !== 'false'; // default true
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && ORDER_STATUSES.includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }
    if (paymentStatus) {
      where.razorpayPaymentStatus = paymentStatus;
    }
    // Default: hide orders with no payment attempt (ghost/abandoned checkouts)
    if (hideUnpaid && !paymentStatus) {
      where.razorpayPaymentStatus = { not: null };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } },
        { shippingPhone: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          status: true,
          razorpayPaymentStatus: true,
          deliveryType: true,
          total: true,
          currency: true,
          shippingName: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /admin/orders/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PATCH /admin/orders/:id  { status }
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body as { status?: string };
    const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : undefined;

    if (!status || !ORDER_STATUSES.includes(status as OrderStatus)) {
      res.status(400).json({ error: 'Valid status is required: ' + ORDER_STATUSES.join(', ') });
      return;
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
      include: orderInclude,
    });
    res.json({ order });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
