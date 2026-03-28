import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import {
  getOrders,
  formatPaise,
  type OrderStatus,
  type OrderListItem,
} from '@/api/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All payments' },
  { value: 'captured', label: 'Captured' },
  { value: 'failed', label: 'Failed' },
  { value: 'authorized', label: 'Authorized' },
  { value: 'created', label: 'Created' },
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
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [hideUnpaid, setHideUnpaid] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);
    getOrders({ status: status || undefined, paymentStatus: paymentStatus || undefined, search: search || undefined, hideUnpaid, page, limit: 20 })
      .then((res) => { setOrders(res.orders); setPagination(res.pagination); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [status, paymentStatus, search, hideUnpaid, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total orders</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order #, email, name, phone..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
          {search && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus((e.target.value || '') as '' | OrderStatus); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAYMENT_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={hideUnpaid} onChange={(e) => { setHideUnpaid(e.target.checked); setPage(1); }} className="rounded border-input" />
            Hide unpaid
          </label>
        </div>
      </div>

      {error && (
        <Card className="border-destructive"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>
      )}

      {loading ? <TableSkeleton /> : orders.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No orders found.</CardContent></Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{o.orderNumber}</div>
                          {o.deliveryType === 'CAMPUS' && (
                            <Badge variant="purple" className="mt-0.5 text-[10px]">Campus</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{o.shippingName || '—'}</div>
                          <div className="text-xs text-muted-foreground">{o.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={STATUS_BADGE_VARIANT[o.status] ?? 'secondary'}>
                            {o.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {o.razorpayPaymentStatus ? (
                            <Badge variant={PAYMENT_BADGE_VARIANT[o.razorpayPaymentStatus] ?? 'secondary'}>
                              {o.razorpayPaymentStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{formatPaise(o.total)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
