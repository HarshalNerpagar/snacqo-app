import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReviews, deleteReview, type ReviewListItem } from '@/api/reviews';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return <Badge variant="secondary" className="text-xs">No rating</Badge>;

  const variant = rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'destructive';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25'
            )}
          />
        ))}
      </div>
      <Badge variant={variant} className="text-xs">{rating}/5</Badge>
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    setError(null);
    getReviews({ page, limit: 20 })
      .then((res) => { setReviews(res.reviews); setPagination(res.pagination); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeleting(id);
    deleteReview(id)
      .then(() => { setReviews((prev) => prev.filter((r) => r.id !== id)); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to delete'))
      .finally(() => setDeleting(null));
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
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reviews</h1>
        </div>
        <Badge variant="secondary">{pagination.total} total</Badge>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-3 w-[200px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => {
              const reviewer = [r.reviewerFirstName, r.reviewerLastName].filter(Boolean).join(' ') || 'Anonymous';
              const products = r.order.items.map((i) => i.productName).join(', ');
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="font-medium text-sm">{reviewer}</span>
                            <StarRating rating={r.rating} />
                            <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Order{' '}
                            <Link to={`/orders/${r.order.id}`} className="text-primary hover:underline font-medium">
                              {r.order.orderNumber}
                            </Link>
                            {products && <> &mdash; {products}</>}
                          </p>
                          {r.text && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.text}</p>
                          )}
                          {r.imageUrls.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {r.imageUrls.map((url, i) => (
                                <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-md border" />
                              ))}
                            </div>
                          )}
                          {r.videoUrl && (
                            <video src={r.videoUrl} controls className="mt-3 max-h-32 rounded-md border" />
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {deleting === r.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

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
    </motion.div>
  );
}
