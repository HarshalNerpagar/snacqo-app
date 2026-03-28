import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Truck, MapPin, CreditCard, ShoppingBag } from 'lucide-react';
import {
  getOrderById,
  updateOrderStatus,
  formatPaise,
  type OrderDetail,
  type OrderStatus,
} from '@/api/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
];

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'purple'> = {
  PENDING: 'warning',
  PROCESSING: 'warning',
  SHIPPED: 'info',
  OUT_FOR_DELIVERY: 'purple',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

const PAYMENT_BADGE_VARIANT: Record<string, 'success' | 'destructive' | 'info' | 'secondary'> = {
  captured: 'success',
  failed: 'destructive',
  authorized: 'info',
  created: 'secondary',
};

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return iso; }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handleCopy} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrderById(id)
      .then((res) => { setOrder(res.order); setStatusDraft(res.order.status); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = () => {
    if (!id || statusDraft == null || statusDraft === order?.status) return;
    setUpdating(true);
    setUpdateMsg(null);
    updateOrderStatus(id, statusDraft)
      .then((res) => { setOrder(res.order); setUpdateMsg({ type: 'success', text: 'Status updated.' }); setTimeout(() => setUpdateMsg(null), 3000); })
      .catch((err) => setUpdateMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' }))
      .finally(() => setUpdating(false));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Card className="border-destructive"><CardContent className="p-6 text-destructive">{error ?? 'Order not found'}</CardContent></Card>
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
      </div>
    );
  }

  const customerName = order.user
    ? [order.user.firstName, order.user.lastName].filter(Boolean).join(' ') || order.user.email
    : order.shippingName || order.email;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
            <CopyButton text={order.orderNumber} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusDraft ?? order.status}
            onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <Button onClick={handleUpdateStatus} disabled={updating || statusDraft === order.status} size="sm">
            {updating ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      {updateMsg && (
        <Card className={updateMsg.type === 'success' ? 'border-emerald-200' : 'border-destructive'}>
          <CardContent className={`p-3 text-sm ${updateMsg.type === 'success' ? 'text-emerald-700' : 'text-destructive'}`}>{updateMsg.text}</CardContent>
        </Card>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[order.status] ?? 'secondary'}>{order.status.replace('_', ' ')}</Badge>
        {order.razorpayPaymentStatus && (
          <Badge variant={PAYMENT_BADGE_VARIANT[order.razorpayPaymentStatus] ?? 'secondary'}>
            Payment: {order.razorpayPaymentStatus}
          </Badge>
        )}
        {order.deliveryType === 'CAMPUS' && <Badge variant="purple">Campus delivery</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Customer</dt><dd className="font-medium">{customerName}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd>{order.email}</dd></div>
              <Separator />
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPaise(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{order.shippingAmount === 0 ? 'Free' : formatPaise(order.shippingAmount)}</dd></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-emerald-600">-{formatPaise(order.discountAmount)}</dd></div>
              )}
              {order.couponCode && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Coupon</dt><dd className="font-mono text-xs">{order.couponCode}</dd></div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base"><dt>Total</dt><dd>{formatPaise(order.total)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {order.deliveryType === 'CAMPUS' ? <MapPin className="w-4 h-4 text-purple-500" /> : <Truck className="w-4 h-4 text-muted-foreground" />}
              <CardTitle className="text-sm">{order.deliveryType === 'CAMPUS' ? 'Campus Delivery' : 'Shipping Address'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingPhone}</p>
              {order.deliveryType === 'CAMPUS' && order.campus && (
                <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-800">
                  <p className="font-medium">{order.campus.name}</p>
                  <p>{order.campus.line1}, {order.campus.city}, {order.campus.state} {order.campus.pincode}</p>
                </div>
              )}
              {order.deliveryType !== 'CAMPUS' && (
                <div className="text-muted-foreground">
                  <p>{order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ''}</p>
                  <p>{order.shippingCity}, {order.shippingState} {order.shippingPincode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment */}
      {(order.razorpayOrderId || order.razorpayPaymentId) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">Payment Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {order.razorpayPaymentStatus && (
                <div>
                  <dt className="text-muted-foreground mb-1">Status</dt>
                  <dd><Badge variant={PAYMENT_BADGE_VARIANT[order.razorpayPaymentStatus] ?? 'secondary'}>{order.razorpayPaymentStatus}</Badge></dd>
                </div>
              )}
              {order.razorpayOrderId && (
                <div>
                  <dt className="text-muted-foreground mb-1">Order ID</dt>
                  <dd className="font-mono text-xs flex items-center gap-1.5">{order.razorpayOrderId} <CopyButton text={order.razorpayOrderId} /></dd>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div>
                  <dt className="text-muted-foreground mb-1">Payment ID</dt>
                  <dd className="font-mono text-xs flex items-center gap-1.5">{order.razorpayPaymentId} <CopyButton text={order.razorpayPaymentId} /></dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Variant / SKU</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2.5 px-4 font-medium">{item.productName}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{item.variantName} <span className="text-xs">({item.variant.sku})</span></td>
                    <td className="py-2.5 px-4 text-right">{item.quantity}</td>
                    <td className="py-2.5 px-4 text-right">{formatPaise(item.price)}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{formatPaise(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
