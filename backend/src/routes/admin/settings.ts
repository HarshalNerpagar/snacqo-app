import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { getShippingConfig } from '../cart.js';
import prisma from '../../lib/prisma.js';

const router = Router();

const KEY_ALLOW_MULTIPLE_COUPONS = 'allow_multiple_coupons';

const SHIPPING_KEYS = {
  freeThreshold: 'shipping_free_threshold',
  lowThreshold: 'shipping_low_threshold',
  chargeBelow: 'shipping_charge_below_low',
  chargeAbove: 'shipping_charge_above_low',
} as const;

// GET /admin/settings
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY_ALLOW_MULTIPLE_COUPONS } });
    const allowMultipleCoupons = row?.value === 'true';
    const shipping = await getShippingConfig(prisma);

    res.json({
      allowMultipleCoupons,
      shipping: {
        freeThresholdPaise: shipping.freeThreshold,
        lowThresholdPaise: shipping.lowThreshold,
        chargeBelowLowPaise: shipping.chargeBelow,
        chargeAboveLowPaise: shipping.chargeAbove,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PATCH /admin/settings
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      allowMultipleCoupons?: boolean;
      shipping?: {
        freeThresholdPaise?: number;
        lowThresholdPaise?: number;
        chargeBelowLowPaise?: number;
        chargeAboveLowPaise?: number;
      };
    };

    // Update coupon setting if provided
    if (typeof body.allowMultipleCoupons === 'boolean') {
      await prisma.setting.upsert({
        where: { key: KEY_ALLOW_MULTIPLE_COUPONS },
        create: { key: KEY_ALLOW_MULTIPLE_COUPONS, value: body.allowMultipleCoupons ? 'true' : 'false' },
        update: { value: body.allowMultipleCoupons ? 'true' : 'false' },
      });
    }

    // Update shipping settings if provided
    if (body.shipping) {
      const s = body.shipping;
      const updates: { key: string; value: string }[] = [];

      if (typeof s.freeThresholdPaise === 'number') {
        if (s.freeThresholdPaise < 0) { res.status(400).json({ error: 'Free shipping threshold must be non-negative.' }); return; }
        updates.push({ key: SHIPPING_KEYS.freeThreshold, value: String(Math.round(s.freeThresholdPaise)) });
      }
      if (typeof s.lowThresholdPaise === 'number') {
        if (s.lowThresholdPaise < 0) { res.status(400).json({ error: 'Low tier threshold must be non-negative.' }); return; }
        updates.push({ key: SHIPPING_KEYS.lowThreshold, value: String(Math.round(s.lowThresholdPaise)) });
      }
      if (typeof s.chargeBelowLowPaise === 'number') {
        if (s.chargeBelowLowPaise < 0) { res.status(400).json({ error: 'Shipping charge must be non-negative.' }); return; }
        updates.push({ key: SHIPPING_KEYS.chargeBelow, value: String(Math.round(s.chargeBelowLowPaise)) });
      }
      if (typeof s.chargeAboveLowPaise === 'number') {
        if (s.chargeAboveLowPaise < 0) { res.status(400).json({ error: 'Shipping charge must be non-negative.' }); return; }
        updates.push({ key: SHIPPING_KEYS.chargeAbove, value: String(Math.round(s.chargeAboveLowPaise)) });
      }

      for (const { key, value } of updates) {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
    }

    // Return the full current state
    const row = await prisma.setting.findUnique({ where: { key: KEY_ALLOW_MULTIPLE_COUPONS } });
    const shipping = await getShippingConfig(prisma);

    res.json({
      allowMultipleCoupons: row?.value === 'true',
      shipping: {
        freeThresholdPaise: shipping.freeThreshold,
        lowThresholdPaise: shipping.lowThreshold,
        chargeBelowLowPaise: shipping.chargeBelow,
        chargeAboveLowPaise: shipping.chargeAbove,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
