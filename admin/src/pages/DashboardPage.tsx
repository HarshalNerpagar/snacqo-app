import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { getDashboard, formatPaise, type DashboardResponse } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8',
  PROCESSING: '#f59e0b',
  SHIPPED: '#0ea5e9',
  OUT_FOR_DELIVERY: '#8b5cf6',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function StatCard({ title, value, icon: Icon, iconColor, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  subtitle?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-24" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-6 w-12" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-72 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-destructive text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { orders, revenue, lowStock, counts, productWiseOrders, ordersByDay, ordersByStatus } = data;
  const avgOrderValue = orders.total > 0 ? Math.round((revenue.thisWeekPaise / Math.max(1, orders.thisWeek))) : 0;

  const ordersByDayFormatted = ordersByDay.map((d) => ({
    ...d,
    dateShort: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: Math.round(d.revenuePaise / 100),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store performance</p>
        </div>
      </div>

      {/* Top stat cards */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={stagger} initial="hidden" animate="show">
        <StatCard title="Orders today" value={orders.today} icon={ShoppingCart} iconColor="bg-blue-50 text-blue-600" />
        <StatCard title="Orders this week" value={orders.thisWeek} icon={TrendingUp} iconColor="bg-purple-50 text-purple-600" />
        <StatCard title="Revenue today" value={formatPaise(revenue.todayPaise)} icon={DollarSign} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard title="Revenue this week" value={formatPaise(revenue.thisWeekPaise)} icon={DollarSign} iconColor="bg-amber-50 text-amber-600" subtitle={avgOrderValue > 0 ? `AOV: ${formatPaise(avgOrderValue)}` : undefined} />
      </motion.div>

      {/* Secondary metrics */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <Card><CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total orders</p>
            <p className="text-xl font-bold">{orders.total}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="border-emerald-200"><CardContent className="p-4 text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Delivered</p>
            <p className="text-xl font-bold text-emerald-700">{orders.delivered}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="border-red-200"><CardContent className="p-4 text-center">
            <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
            <p className="text-xl font-bold text-red-700">{orders.cancelled}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card><CardContent className="p-4 text-center">
            <Package className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Products</p>
            <p className="text-xl font-bold">{counts.activeProducts}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card><CardContent className="p-4 text-center">
            <Ticket className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Coupons</p>
            <p className="text-xl font-bold">{counts.activeCoupons}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="border-blue-200"><CardContent className="p-4 text-center">
            <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">Customers</p>
            <p className="text-xl font-bold text-blue-700">{counts.totalCustomers}</p>
          </CardContent></Card>
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders & Revenue chart (2 cols) */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders & Revenue (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersByDayFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dateShort" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                    formatter={(value?: number, name?: string) => (name === 'Revenue (₹)' ? `₹${value ?? 0}` : (value ?? 0))}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" fill="url(#colorOrders)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donut chart (1 col) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersByStatus.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {ordersByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product-wise orders */}
      {productWiseOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Products (delivered orders)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productWiseOrders} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="productName" width={90} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} formatter={(value?: number, name?: string) => [value ?? 0, name === 'quantitySold' ? 'Units sold' : 'Orders']} />
                  <Bar dataKey="quantitySold" name="quantitySold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="orderCount" name="orderCount" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> Units sold</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Orders</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low stock */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Low Stock</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No variants with low stock.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Variant / SKU</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 font-medium">{v.product.name}</td>
                      <td className="py-2.5 text-muted-foreground">{v.name} <span className="text-xs">({v.sku})</span></td>
                      <td className="py-2.5">{v.stock}</td>
                      <td className="py-2.5">
                        <Badge variant={v.outOfStock ? 'destructive' : 'warning'}>
                          {v.outOfStock ? 'Out of stock' : 'Low stock'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link to={`/products/${v.product.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
