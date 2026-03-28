import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes default
    },
  },
});

// Centralised query keys — makes invalidation easy and typo-proof
export const queryKeys = {
  categories: ['categories'] as const,
  products: (category?: string) => ['products', category ?? 'all'] as const,
  productBySlug: (slug: string) => ['product', slug] as const,
  productReviews: (slug: string) => ['productReviews', slug] as const,
  cart: ['cart'] as const,
  cartSummary: (couponCodes: string[], isCampus: boolean, campusId: string) =>
    ['cartSummary', couponCodes, isCampus, campusId] as const,
  addresses: ['addresses'] as const,
  orders: ['orders'] as const,
  profile: ['profile'] as const,
  settings: ['settings'] as const,
  campuses: ['campuses'] as const,
} as const;
