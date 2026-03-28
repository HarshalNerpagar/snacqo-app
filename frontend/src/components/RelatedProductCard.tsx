import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '@/types/product';

interface RelatedProductCardProps {
  product: Product;
  /** Optional badge e.g. "HOT" */
  tag?: string;
  onAddToCart?: (product: Product) => void;
}

export function RelatedProductCard({ product, tag, onAddToCart }: RelatedProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product);
    setJustAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAdded(false), 1500);
  };
  return (
    <motion.div
      className="group relative hover:-translate-y-2 transition-transform duration-300"
      whileHover={{ y: -8 }}
    >
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="bg-white border-2 border-text-chocolate p-4 flex flex-col h-full shadow-chunky">
          {tag && (
            <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-2 py-1 border-2 border-text-chocolate z-10 rotate-6 shadow-chunky-sm">
              {tag}
            </div>
          )}
          <div
            className={`${product.iconBgColor ?? 'bg-secondary'} w-full aspect-square border-2 border-text-chocolate mb-4 relative overflow-hidden`}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-6xl ${product.iconColor ?? 'text-text-chocolate/20'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden
                >
                  {product.icon}
                </span>
              </div>
            )}
            {product.outOfStock ? (
              <span className="absolute bottom-2 right-2 bg-gray-200 text-text-chocolate/60 px-2 py-1 text-xs font-bold border border-text-chocolate/40">
                Out of stock
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={`absolute bottom-2 right-2 p-2 border-2 border-text-chocolate shadow-chunky-sm transition-colors ${
                  justAdded
                    ? 'bg-green-400 text-text-chocolate'
                    : 'bg-white hover:bg-primary hover:text-white'
                }`}
                aria-label={`Add ${product.name} to cart`}
              >
                <span className="material-symbols-outlined text-sm font-bold">
                  {justAdded ? 'check' : 'add_shopping_cart'}
                </span>
              </button>
            )}
          </div>
          <h3 className="product-font font-bold text-xl text-text-chocolate leading-tight mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-text-chocolate/60 font-bold mb-3 uppercase">
            {product.category}
          </p>
          <div className="mt-auto flex justify-between items-center">
            <span className="font-bold text-lg text-primary">{product.price}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
