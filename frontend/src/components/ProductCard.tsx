import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/useCart';
import { addCartItem, updateCartItemQuantity, removeCartItem } from '@/api/cart';
import type { Product, ProductVariantOption } from '@/types/product';
import type { CartItemResponse } from '@/api/cart';

const DEBOUNCE_MS = 400;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: string) => Promise<CartItemResponse[] | void>;
  /** Alternate rotation on hover for visual variety in grid */
  hoverRotate?: 1 | -1;
}

export function ProductCard({ product, onAddToCart, hoverRotate = 1 }: ProductCardProps) {
  const { applyCartResponse, getQuantityForVariant, refreshCart } = useCart();
  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const defaultId = product.defaultVariantId ?? variants[0]?.id;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(defaultId ?? null);

  const selectedVariant: ProductVariantOption | undefined = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId)
    : variants[0];
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const variantForCart = selectedVariantId ?? product.defaultVariantId;
  const isOutOfStock = selectedVariant ? selectedVariant.outOfStock : product.outOfStock ?? false;

  // Server-confirmed quantity from context
  const serverQty = variantForCart ? getQuantityForVariant(variantForCart) : 0;

  // Local display quantity — updated instantly on every tap, no waiting for server
  const [localQty, setLocalQty] = useState(serverQty);

  // Keep localQty in sync when server value changes (e.g. after debounce reconcile or page refocus)
  // but only when there's no pending debounce in flight
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQtyRef = useRef<number | null>(null);
  const addingFirstItemRef = useRef(false); // prevents double-fire on "Add to Cart"

  useEffect(() => {
    // Don't overwrite local state while user is actively tapping
    if (debounceRef.current === null && pendingQtyRef.current === null) {
      setLocalQty(serverQty);
    }
  }, [serverQty]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const flushToServer = useCallback(
    (variantId: string, qty: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        const target = pendingQtyRef.current ?? qty;
        pendingQtyRef.current = null;
        try {
          const { cart } = target === 0
            ? await removeCartItem(variantId)
            : await updateCartItemQuantity(variantId, target);
          applyCartResponse(cart.items as CartItemResponse[]);
        } catch {
          // Roll back display to last server value on error
          setLocalQty(serverQty);
          refreshCart();
        }
      }, DEBOUNCE_MS);
    },
    [applyCartResponse, refreshCart, serverQty]
  );

  const handleAddOne = () => {
    if (!variantForCart || isOutOfStock) return;
    const next = localQty + 1;
    setLocalQty(next);
    pendingQtyRef.current = next;
    flushToServer(variantForCart, next);
  };

  const handleRemoveOne = () => {
    if (!variantForCart || localQty <= 0) return;
    const next = Math.max(0, localQty - 1);
    setLocalQty(next);
    pendingQtyRef.current = next;
    flushToServer(variantForCart, next);
  };

  // "Add to Cart" — qty 0 → 1. Instantly show stepper, fire API in background.
  const handleAddToCartClick = () => {
    if (!variantForCart || isOutOfStock || addingFirstItemRef.current) return;
    addingFirstItemRef.current = true;
    // Show stepper immediately — no waiting for server
    setLocalQty(1);
    pendingQtyRef.current = 1;

    const fire = async () => {
      try {
        if (onAddToCart) {
          const updatedItems = await onAddToCart(product, variantForCart);
          if (updatedItems) applyCartResponse(updatedItems);
        } else {
          const { cart } = await addCartItem(variantForCart, 1);
          applyCartResponse(cart.items as CartItemResponse[]);
        }
      } catch {
        // Roll back the optimistic stepper show on error
        setLocalQty(0);
        pendingQtyRef.current = null;
        refreshCart();
      } finally {
        addingFirstItemRef.current = false;
        pendingQtyRef.current = null;
      }
    };
    fire();
  };

  // When variant changes, reset local qty to match that variant's server qty
  const prevVariantRef = useRef(variantForCart);
  if (prevVariantRef.current !== variantForCart) {
    prevVariantRef.current = variantForCart;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pendingQtyRef.current = null;
    setLocalQty(serverQty);
  }

  const priceLabel = 'Price';

  return (
    <div
      className={`group relative transition-all duration-300 hover:z-20 ${
        hoverRotate === 1 ? 'hover:rotate-1' : 'hover:-rotate-1'
      }`}
    >
      <div className="bg-white border-4 border-text-chocolate p-2 sm:p-4 h-full flex flex-col shadow-[6px_6px_0px_0px_#2D1B0E] group-hover:shadow-[10px_10px_0px_0px_#2D1B0E] transition-shadow min-h-0">
        {/* Image: always square (1:1); on mobile constrained width for proportion */}
        <div className="relative w-full max-w-[140px] sm:max-w-none mx-auto flex-shrink-0 mb-2 sm:mb-4 rounded-none isolate">
          <div className="w-full aspect-square bg-secondary border-2 border-text-chocolate overflow-hidden">
            <Link
              to={`/shop/${product.slug}`}
              className="block w-full h-full bg-secondary border-0 overflow-hidden"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center ${product.iconBgColor}`}>
                <span
                  className={`material-symbols-outlined text-8xl transition-colors duration-300 ${product.iconColor ?? 'text-primary group-hover:text-accent-strawberry'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden
                >
                  {product.icon}
                </span>
              </div>
            )}
          </Link>
          {product.tapeLabel && (
            <div
              className="absolute top-0 right-0 translate-x-2 -translate-y-0.5 bg-accent-mango tape-strip-yellow px-3 py-1.5 rotate-[28deg] shadow-md border-2 border-text-chocolate z-[100]"
              aria-hidden
            >
              <span className="block text-xs font-black text-text-chocolate tracking-widest text-center whitespace-nowrap">
                {product.tapeLabel?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        </div>

        <div className="flex flex-col flex-grow">
          <Link to={`/shop/${product.slug}`}>
            <h3 className="text-sm sm:text-xl font-bold font-product text-text-chocolate leading-tight mb-1 sm:mb-2 hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-text-chocolate/70 font-medium mb-2 sm:mb-3 font-product line-clamp-2">
            {product.description}
          </p>

          {variants.length > 1 && (
            <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3">
              {variants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => !v.outOfStock && setSelectedVariantId(v.id)}
                    disabled={v.outOfStock}
                    className={`flex-1 py-1 text-xs font-black border-2 border-text-chocolate shadow-[1px_1px_0px_0px_#2D1B0E] transition-colors ${
                      v.outOfStock
                        ? 'bg-gray-100 text-text-chocolate/50 cursor-not-allowed'
                        : isSelected
                          ? 'bg-accent-strawberry text-white'
                          : 'bg-white text-text-chocolate hover:bg-gray-50'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between mb-2 sm:mb-4 mt-auto pt-2 border-t-2 border-text-chocolate/10 border-dashed">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-text-chocolate/50 tracking-wider">
              {priceLabel}
            </span>
            <span className="font-bold text-base sm:text-lg text-primary font-product whitespace-nowrap">
              {displayPrice}
            </span>
          </div>
        </div>

        {isOutOfStock ? (
          <div className="w-full py-3 bg-text-chocolate/20 text-text-chocolate/70 text-base border-2 border-text-chocolate/40 font-bold tracking-wider text-center btn-text uppercase cursor-not-allowed">
            Out of stock
          </div>
        ) : localQty > 0 ? (
          <div className="flex items-center bg-white border-2 border-text-chocolate shadow-[3px_3px_0px_0px_#2D1B0E]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRemoveOne();
              }}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 border-r-2 border-text-chocolate transition-colors active:bg-gray-200"
              aria-label="Decrease quantity"
            >
              <span className="material-symbols-outlined font-bold text-lg">remove</span>
            </button>
            <span className="flex-1 text-center text-lg font-bold font-product text-text-chocolate py-2 tabular-nums">
              {localQty}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleAddOne();
              }}
              className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 border-l-2 border-text-chocolate transition-colors active:bg-gray-200"
              aria-label="Increase quantity"
            >
              <span className="material-symbols-outlined font-bold text-lg">add</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full py-2 sm:py-3 bg-primary text-white text-xs sm:text-base border-2 border-text-chocolate font-bold tracking-wider shadow-[3px_3px_0px_0px_#2D1B0E] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#2D1B0E] transition-all btn-text uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#2D1B0E]"
            onClick={(e) => {
              e.preventDefault();
              handleAddToCartClick();
            }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
