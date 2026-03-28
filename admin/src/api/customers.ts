import { request } from './client';

export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
}

export interface CustomerDetail extends CustomerListItem {
  birthday: string | null;
  emailVerified: boolean;
  totalSpentPaise: number;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    razorpayPaymentStatus: string | null;
    createdAt: string;
  }[];
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function getCustomers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CustomerListResponse> {
  const search = new URLSearchParams();
  if (params?.search) search.set('search', params.search);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request<CustomerListResponse>(`/admin/customers${qs ? `?${qs}` : ''}`);
}

export function getCustomerById(id: string): Promise<{ customer: CustomerDetail }> {
  return request(`/admin/customers/${id}`);
}
