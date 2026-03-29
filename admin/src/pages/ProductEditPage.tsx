import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getProductById,
  updateProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  uploadProductImages,
  updateImageSortOrder,
  deleteProductImage,
  formatPaise,
  type Product,
  type ProductVariant,
  type ProductImage,
} from '@/api/products';
import { getCategories } from '@/api/categories';
import type { Category } from '@/api/categories';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

// ----- Basic product form -----
function ProductBasicForm({
  product,
  categories,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [description, setDescription] = useState(product.description);
  const [shortDescription, setShortDescription] = useState(product.shortDescription ?? '');
  const [ingredients, setIngredients] = useState(product.ingredients ?? '');
  const [nutritionText, setNutritionText] = useState(
    product.nutrition && product.nutrition.length > 0
      ? product.nutrition.map((r) => `${r.label}: ${r.value}`).join('\n')
      : ''
  );
  const [cardLabel, setCardLabel] = useState(product.cardLabel ?? '');
  const [isActive, setIsActive] = useState(product.isActive);
  const [sortOrder, setSortOrder] = useState(product.sortOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CARD_LABEL_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'Bestseller', label: 'Bestseller' },
    { value: 'Hot', label: 'Hot' },
    { value: 'Favourite', label: 'Favourite' },
    { value: 'New drop', label: 'New drop' },
    { value: 'Value', label: 'Value' },
  ];

  useEffect(() => {
    setName(product.name);
    setSlug(product.slug);
    setCategoryId(product.categoryId);
    setDescription(product.description);
    setShortDescription(product.shortDescription ?? '');
    setIngredients(product.ingredients ?? '');
    setNutritionText(
      product.nutrition && product.nutrition.length > 0
        ? product.nutrition.map((r) => `${r.label}: ${r.value}`).join('\n')
        : ''
    );
    setCardLabel(product.cardLabel ?? '');
    setIsActive(product.isActive);
    setSortOrder(product.sortOrder);
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setSaving(true);
    setError(null);
    updateProduct(product.id, {
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
      .then(() => onSaved())
      .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
      .finally(() => setSaving(false));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="font-mono"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Short description</label>
        <Input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Card label</label>
        <select
          value={cardLabel}
          onChange={(e) => setCardLabel(e.target.value)}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {CARD_LABEL_OPTIONS.map((opt) => (
            <option key={opt.value || 'none'} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {cardLabel && !CARD_LABEL_OPTIONS.some((o) => o.value === cardLabel) && (
            <option value={cardLabel}>{cardLabel}</option>
          )}
        </select>
        <p className="text-xs text-muted-foreground">Shown on product card (e.g. Bestseller, Hot)</p>
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
      <Separator />
      <Button type="submit" disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}

// ----- Variants section -----
function VariantsSection({
  productId,
  variants,
  onRefresh,
}: {
  productId: string;
  variants: ProductVariant[];
  onRefresh: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [vName, setVName] = useState('');
  const [vSku, setVSku] = useState('');
  const [vPricePaise, setVPricePaise] = useState('');
  const [vComparePaise, setVComparePaise] = useState('');
  const [vStock, setVStock] = useState(0);
  const [vWeight, setVWeight] = useState('');
  const [vOutOfStock, setVOutOfStock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setVName('');
    setVSku('');
    setVPricePaise('');
    setVComparePaise('');
    setVStock(0);
    setVWeight('');
    setVOutOfStock(false);
    setFormError(null);
    setEditing(null);
    setAddOpen(false);
  };

  const openEdit = (v: ProductVariant) => {
    setEditing(v);
    setVName(v.name);
    setVSku(v.sku);
    setVPricePaise((v.price / 100).toFixed(2));
    setVComparePaise(v.compareAtPrice != null ? (v.compareAtPrice / 100).toFixed(2) : '');
    setVStock(v.stock);
    setVWeight(v.weightGrams != null ? String(v.weightGrams) : '');
    setVOutOfStock(v.outOfStock);
    setFormError(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const priceRupees = parseFloat(vPricePaise);
    const price = Math.round((Number.isFinite(priceRupees) ? priceRupees : 0) * 100);
    if (!vName.trim() || !vSku.trim() || price < 0) {
      setFormError('Name, SKU, and price are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const compareRupees = vComparePaise === '' ? null : parseFloat(vComparePaise);
    addVariant(productId, {
      name: vName.trim(),
      sku: vSku.trim().toUpperCase(),
      price,
      compareAtPrice: compareRupees != null && Number.isFinite(compareRupees) ? Math.round(compareRupees * 100) : null,
      stock: vStock,
      weightGrams: vWeight === '' ? null : Math.round(parseFloat(vWeight) || 0),
      outOfStock: vOutOfStock,
    })
      .then(() => { resetForm(); onRefresh(); })
      .catch((err) => setFormError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setSaving(false));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const priceRupees = parseFloat(vPricePaise);
    const price = Math.round((Number.isFinite(priceRupees) ? priceRupees : 0) * 100);
    if (!vName.trim() || !vSku.trim()) {
      setFormError('Name and SKU required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const compareRupees = vComparePaise === '' ? null : parseFloat(vComparePaise);
    updateVariant(productId, editing.id, {
      name: vName.trim(),
      sku: vSku.trim().toUpperCase(),
      price,
      compareAtPrice: compareRupees != null && Number.isFinite(compareRupees) ? Math.round(compareRupees * 100) : null,
      stock: vStock,
      weightGrams: vWeight === '' ? null : Math.round(parseFloat(vWeight) || 0),
      outOfStock: vOutOfStock,
    })
      .then(() => { resetForm(); onRefresh(); })
      .catch((err) => setFormError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setSaving(false));
  };

  const handleDelete = (vid: string) => {
    if (!confirm('Delete this variant? (Not allowed if in cart/orders)')) return;
    setDeletingId(vid);
    deleteVariant(productId, vid)
      .then(() => onRefresh())
      .catch(() => {})
      .finally(() => setDeletingId(null));
  };

  const handleOutOfStockToggle = (v: ProductVariant) => {
    updateVariant(productId, v.id, { outOfStock: !v.outOfStock })
      .then(() => onRefresh())
      .catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Variants</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { resetForm(); setAddOpen(true); }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add variant
        </Button>
      </div>

      {(addOpen || editing) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <form onSubmit={editing ? handleUpdate : handleAdd} className="space-y-3">
              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">SKU</label>
                  <Input
                    value={vSku}
                    onChange={(e) => setVSku(e.target.value.toUpperCase())}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Price (Rs.)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={vPricePaise}
                    onChange={(e) => setVPricePaise(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Compare at (Rs.)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={vComparePaise}
                    onChange={(e) => setVComparePaise(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Stock</label>
                  <Input
                    type="number"
                    min={0}
                    value={vStock}
                    onChange={(e) => setVStock(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Weight (g)</label>
                  <Input
                    type="number"
                    min={0}
                    value={vWeight}
                    onChange={(e) => setVWeight(e.target.value)}
                    placeholder="--"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 col-span-2 pt-4">
                  <input
                    type="checkbox"
                    checked={vOutOfStock}
                    onChange={(e) => setVOutOfStock(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm">Out of stock</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save' : 'Add'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No variants yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">SKU</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Compare</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Stock</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Weight</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">OOS</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{v.name}</td>
                  <td className="px-3 py-2 text-muted-foreground font-mono">{v.sku}</td>
                  <td className="px-3 py-2 text-right">{formatPaise(v.price)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {v.compareAtPrice != null ? formatPaise(v.compareAtPrice) : '--'}
                  </td>
                  <td className="px-3 py-2 text-right">{v.stock}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {v.weightGrams != null ? `${v.weightGrams}g` : '--'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleOutOfStockToggle(v)}
                    >
                      <Badge variant={v.outOfStock ? 'warning' : 'secondary'} className="cursor-pointer">
                        {v.outOfStock ? 'Yes' : 'No'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(v)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ----- Images section -----
function ImagesSection({
  productId,
  images,
  onRefresh,
}: {
  productId: string;
  images: ProductImage[];
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);
    const fileList = Array.from(files);
    uploadProductImages(productId, fileList)
      .then(() => onRefresh())
      .catch((err) => setUploadError(err instanceof Error ? err.message : 'Upload failed'))
      .finally(() => {
        setUploading(false);
        e.target.value = '';
      });
  };

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMove = (img: ProductImage, delta: number) => {
    const idx = sorted.findIndex((i) => i.id === img.id);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(sorted.length - 1, idx + delta));
    if (newIdx === idx) return;
    const other = sorted[newIdx];
    Promise.all([
      updateImageSortOrder(productId, img.id, other.sortOrder),
      updateImageSortOrder(productId, other.id, img.sortOrder),
    ])
      .then(() => onRefresh())
      .catch(() => {});
  };

  const handleDeleteImg = (imageId: string) => {
    if (!confirm('Remove this image?')) return;
    setDeletingId(imageId);
    deleteProductImage(productId, imageId)
      .then(() => onRefresh())
      .catch(() => {})
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Images</h3>
        <label className="cursor-pointer">
          <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
            <span>
              <Upload className="mr-1 h-3.5 w-3.5" />
              {uploading ? 'Uploading...' : 'Upload images'}
            </span>
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      {uploadError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm">
          {uploadError}
        </div>
      )}
      {sorted.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg py-8 text-center text-muted-foreground">
          <Upload className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">No images yet. Upload some to get started.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {sorted.map((img, idx) => (
            <div key={img.id} className="group relative border rounded-lg overflow-hidden bg-muted/30">
              <img src={img.url} alt="" className="w-32 h-32 object-cover" />
              <div className="p-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">
                  #{img.sortOrder}
                </Badge>
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMove(img, -1)}
                    disabled={idx === 0}
                    title="Move left"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMove(img, 1)}
                    disabled={idx === sorted.length - 1}
                    title="Move right"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteImg(img.id)}
                    disabled={deletingId === img.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Main edit page -----
export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = () => {
    if (!id) return;
    getProductById(id)
      .then((res) => setProduct(res.product))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCategories().then((res) => setCategories(res.categories)).catch(() => {});
    getProductById(id)
      .then((res) => {
        setProduct(res.product);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading && !product) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
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
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Edit: {product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={product.isActive ? 'success' : 'secondary'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {product.cardLabel && (
                <Badge variant="purple">{product.cardLabel}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductBasicForm
            product={product}
            categories={categories}
            onSaved={() => loadProduct()}
          />
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variants & Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <VariantsSection
            productId={product.id}
            variants={product.variants}
            onRefresh={loadProduct}
          />
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImagesSection
            productId={product.id}
            images={product.images}
            onRefresh={loadProduct}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
