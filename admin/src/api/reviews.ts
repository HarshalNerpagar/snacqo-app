import { request } from './client';

export interface ReviewListItem {
  id: string;
  rating: number | null;
  text: string | null;
  imageUrls: string[];
  videoUrl: string | null;
  reviewerFirstName: string | null;
  reviewerLastName: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    items: { productName: string }[];
  };
}

export interface ReviewListResponse {
  reviews: ReviewListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function getReviews(params?: {
  page?: number;
  limit?: number;
}): Promise<ReviewListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request<ReviewListResponse>(`/admin/reviews${qs ? `?${qs}` : ''}`);
}

export function deleteReview(id: string): Promise<void> {
  return request(`/admin/reviews/${id}`, { method: 'DELETE' });
}
