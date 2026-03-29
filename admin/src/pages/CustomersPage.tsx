import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, Users, Phone, Calendar, ShoppingBag, IndianRupee, Cake, ShieldCheck } from 'lucide-react';
import { getCustomers, getCustomerById, type CustomerListItem, type CustomerDetail } from '@/api/customers';
import { formatPaise } from '@/api/orders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    setError(null);
    getCustomers({ search: search || undefined, page, limit: 20 })
      .then((res) => { setCustomers(res.customers); setPagination(res.pagination); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleViewCustomer = (id: string) => {
    setDetailLoading(true);
    getCustomerById(id)
      .then((res) => setSelectedCustomer(res.customer))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Customers</h1>
        </div>
        <Badge variant="secondary">{pagination.total} total</Badge>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email or name..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
        {search && (
          <Button type="button" variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </form>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[40px]" />
                  <Skeleton className="h-4 w-[90px]" />
                  <Skeleton className="h-4 w-[50px] ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No customers found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => {
                    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '\u2014';
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone || '\u2014'}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={c._count.orders > 0 ? 'info' : 'secondary'}>
                            {c._count.orders}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(c.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Customer detail slide-in panel */}
      <AnimatePresence>
        {(selectedCustomer || detailLoading) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setSelectedCustomer(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-xl border-l overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {detailLoading ? (
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-[180px]" />
                      <Skeleton className="h-4 w-[220px]" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-[60px]" />
                        <Skeleton className="h-5 w-[100px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedCustomer ? (
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">
                        {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || 'No name'}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        Phone
                      </div>
                      <p className="text-sm font-medium">{selectedCustomer.phone || '\u2014'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Joined
                      </div>
                      <p className="text-sm font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShoppingBag className="h-3 w-3" />
                        Total orders
                      </div>
                      <p className="text-sm font-medium">{selectedCustomer._count.orders}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IndianRupee className="h-3 w-3" />
                        Total spent
                      </div>
                      <p className="text-sm font-medium text-green-700">{formatPaise(selectedCustomer.totalSpentPaise)}</p>
                    </div>
                    {selectedCustomer.birthday && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Cake className="h-3 w-3" />
                          Birthday
                        </div>
                        <p className="text-sm font-medium">{selectedCustomer.birthday}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        Email verified
                      </div>
                      <Badge variant={selectedCustomer.emailVerified ? 'success' : 'warning'} className="mt-0.5">
                        {selectedCustomer.emailVerified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>

                  {selectedCustomer.orders.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Recent orders</h3>
                        <div className="space-y-2">
                          {selectedCustomer.orders.map((o) => (
                            <div key={o.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                              <div>
                                <span className="font-medium">{o.orderNumber}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                <span className="font-medium">{formatPaise(o.total)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
