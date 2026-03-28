import { request } from './client';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  email: string;
  status: OrderStatus;
  razorpayPaymentStatus: string | null;
  deliveryType: string;
  total: number;
  currency: string;
  shippingName: string;
  createdAt: string;
  _count: { items: number };
}

export interface OrderListResponse {
  orders: OrderListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface OrderItemVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  product: { id: string; slug: string; name: string };
}

export interface OrderItemDetail {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  total: number;
  variant: OrderItemVariant;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  status: OrderStatus;
  deliveryType: string;
  campusId: string | null;
  campus: { id: string; name: string; line1: string; city: string; state: string; pincode: string } | null;
  user: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  couponCode: string | null;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  razorpayPaymentStatus: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDetail[];
}

export interface OrderDetailResponse {
  order: OrderDetail;
}

export function getOrders(params?: {
  status?: OrderStatus;
  paymentStatus?: string;
  search?: string;
  hideUnpaid?: boolean;
  page?: number;
  limit?: number;
}): Promise<OrderListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.paymentStatus) search.set('paymentStatus', params.paymentStatus);
  if (params?.search) search.set('search', params.search);
  if (params?.hideUnpaid === false) search.set('hideUnpaid', 'false');
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request<OrderListResponse>(`/admin/orders${qs ? `?${qs}` : ''}`);
}

export function getOrderById(id: string): Promise<OrderDetailResponse> {
  return request<OrderDetailResponse>(`/admin/orders/${id}`);
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDetailResponse> {
  return request<OrderDetailResponse>(`/admin/orders/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}
