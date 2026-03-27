import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCart } from '@/api/cart';
import type { CartItemResponse } from '@/api/cart';

export interface CartContextValue {
  cartCount: number;
  cartItems: CartItemResponse[];
  refreshCart: () => Promise<void>;
  applyCartResponse: (items: CartItemResponse[]) => void;
  getQuantityForVariant: (variantId: string) => number;
}

export const CartContext = createContext<CartContextValue | null>(null);

function deriveCount(items: CartItemResponse[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const applyItems = useCallback((items: CartItemResponse[]) => {
    setCartItems(items);
    setCartCount(deriveCount(items));
  }, []);

  /** Push server cart data into context without a second HTTP request. */
  const applyCartResponse = useCallback(
    (items: CartItemResponse[]) => {
      applyItems(items);
    },
    [applyItems]
  );

  const refreshCart = useCallback(async () => {
    try {
      const { cart } = await getCart();
      applyItems(cart?.items ?? []);
    } catch {
      applyItems([]);
    }
  }, [applyItems]);

  const getQuantityForVariant = useCallback(
    (variantId: string) => {
      const item = cartItems.find((i) => i.variantId === variantId);
      return item?.quantity ?? 0;
    },
    [cartItems]
  );

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = useMemo(
    () => ({
      cartCount,
      cartItems,
      refreshCart,
      applyCartResponse,
      getQuantityForVariant,
    }),
    [cartCount, cartItems, refreshCart, applyCartResponse, getQuantityForVariant]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
