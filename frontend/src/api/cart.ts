import { request } from './client';

export interface CartItemVariantResponse {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  product: {
    id: string;
    slug: string;
    name: string;
    images: { url: string }[];
  };
}

export interface CartItemResponse {
  id: string;
  variantId: string;
  quantity: number;
  variant: CartItemVariantResponse;
}

export interface CartResponse {
  cart: {
    id: string | null;
    items: CartItemResponse[];
  };
}

export interface CartSummaryResponse {
  summary: {
    subtotal: number;        // paise
    shippingAmount: number;  // paise
    discountAmount: number;  // paise
    total: number;           // paise
    isFreeShipping: boolean;
    nextFreeShippingAt: number | null; // paise threshold to unlock free shipping, null if already free
    itemCount: number;
    couponMessages: Array<{ code: string; message: string; valid: boolean }>;
  };
}

export function getCart(): Promise<CartResponse> {
  return request<CartResponse>('/cart');
}

export function getCartSummary(options?: {
  couponCodes?: string[];
  isCampusOrder?: boolean;
  campusId?: string;
}): Promise<CartSummaryResponse> {
  const params = new URLSearchParams();
  if (options?.couponCodes && options.couponCodes.length > 0) {
    params.set('couponCodes', options.couponCodes.join(','));
  }
  if (options?.isCampusOrder) params.set('isCampusOrder', 'true');
  if (options?.campusId) params.set('campusId', options.campusId);
  const qs = params.toString();
  return request<CartSummaryResponse>(`/cart/summary${qs ? `?${qs}` : ''}`);
}

export function addCartItem(variantId: string, quantity = 1): Promise<CartResponse> {
  return request<CartResponse>('/cart/items', { method: 'POST', body: { variantId, quantity } });
}

export function updateCartItemQuantity(variantId: string, quantity: number): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${encodeURIComponent(variantId)}`, {
    method: 'PATCH',
    body: { quantity },
  });
}

export function removeCartItem(variantId: string): Promise<CartResponse> {
  return request<CartResponse>(`/cart/items/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
}
