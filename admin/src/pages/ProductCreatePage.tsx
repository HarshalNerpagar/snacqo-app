import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProduct } from '@/api/products';
import { getCategories } from '@/api/categories';
import type { Category } from '@/api/categories';
import { motion } from 'framer-motion';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [nutritionText, setNutritionText] = useState('');
  const [cardLabel, setCardLabel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const CARD_LABEL_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'Bestseller', label: 'Bestseller' },
    { value: 'Hot', label: 'Hot' },
    { value: 'Favourite', label: 'Favourite' },
    { value: 'New drop', label: 'New drop' },
    { value: 'Value', label: 'Value' },
  ];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !categoryId) return;
    const nutrition = nutritionText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(':');
        if (idx < 0) return null;
        const label = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean) as { label: string; value: string }[];
    setSubmitting(true);
    setError(null);
    createProduct({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      categoryId,
      description: description.trim(),
      shortDescription: shortDescription.trim() || null,
      ingredients: ingredients.trim() || null,
      nutrition: nutrition.length > 0 ? nutrition : null,
      cardLabel: cardLabel.trim() || null,
      isActive,
      sortOrder,
    })
      .then((res) => navigate(`/products/${res.product.id}`, { replace: true }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to create product'))
      .finally(() => setSubmitting(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-6"
    >
      {/* Back link + Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <PackagePlus className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Add product</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loadingCategories ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Basic details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug || slug === slugFromName(name)) setSlug(slugFromName(e.target.value));
                  }}
                  required
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug *</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  required
                  className="font-mono"
                  placeholder="product-slug"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Card label</label>
                <select
                  value={cardLabel}
                  onChange={(e) => setCardLabel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CARD_LABEL_OPTIONS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Shown on product card (e.g. Bestseller, Hot)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short description</label>
                <Input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief tagline"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingredients</label>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={3}
                  placeholder="E.g. Almonds, Cocoa, Sea salt"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nutrition</label>
                <textarea
                  value={nutritionText}
                  onChange={(e) => setNutritionText(e.target.value)}
                  rows={4}
                  placeholder={"Calories: 120\nProtein: 4g\nSugar: 2g"}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  One per line as <span className="font-mono">Label: Value</span>.
                </p>
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sort order</label>
                  <Input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !slug.trim() || !categoryId}
            >
              {submitting ? 'Creating...' : 'Create product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
