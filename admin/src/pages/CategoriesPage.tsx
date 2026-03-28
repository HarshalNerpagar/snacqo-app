import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/api/categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Plus } from 'lucide-react';

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [addName, setAddName] = useState('');
  const [addSlug, setAddSlug] = useState('');
  const [addSortOrder, setAddSortOrder] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit modal
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    setError(null);
    getCategories()
      .then((res) => setCategories(res.categories))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addSlug.trim()) return;
    setAdding(true);
    setAddError(null);
    createCategory({ name: addName.trim(), slug: addSlug.trim().toLowerCase(), sortOrder: addSortOrder })
      .then(() => {
        setAddName('');
        setAddSlug('');
        setAddSortOrder(0);
        loadCategories();
      })
      .catch((err) => setAddError(err instanceof Error ? err.message : 'Failed to create'))
      .finally(() => setAdding(false));
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditSortOrder(cat.sortOrder);
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setUpdating(true);
    setEditError(null);
    updateCategory(editing.id, {
      name: editName.trim(),
      slug: editSlug.trim().toLowerCase(),
      sortOrder: editSortOrder,
    })
      .then(() => {
        setEditing(null);
        loadCategories();
      })
      .catch((err) => setEditError(err instanceof Error ? err.message : 'Failed to update'))
      .finally(() => setUpdating(false));
  };

  const openDelete = (cat: Category) => {
    setDeleting(cat);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    setDeleteInProgress(true);
    setDeleteError(null);
    deleteCategory(deleting.id)
      .then(() => {
        setDeleting(null);
        loadCategories();
      })
      .catch((err) => setDeleteError(err instanceof Error ? err.message : 'Failed to delete'))
      .finally(() => setDeleteInProgress(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
      </div>

      {/* Add category form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit} className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <Input
                type="text"
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value);
                  if (!addSlug || addSlug === slugFromName(addName)) setAddSlug(slugFromName(e.target.value));
                }}
                className="w-48"
                placeholder="Category name"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Slug</span>
              <Input
                type="text"
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-40 font-mono"
                placeholder="slug"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Sort order</span>
              <Input
                type="number"
                min={0}
                value={addSortOrder}
                onChange={(e) => setAddSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-20"
              />
            </label>
            <Button
              type="submit"
              disabled={adding || !addName.trim() || !addSlug.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </form>
          {addError && (
            <p className="mt-2 text-sm text-destructive">{addError}</p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sort order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{cat.slug}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{cat.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{cat._count.products}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cat)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(cat)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No categories yet.</div>
            )}
          </div>
        </Card>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !updating && setEditing(null)}>
          <Card className="w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit category</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Name</span>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Slug</span>
                  <Input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="mt-1 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Sort order</span>
                  <Input
                    type="number"
                    min={0}
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="mt-1"
                  />
                </label>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deleteInProgress && setDeleting(null)}>
          <Card className="w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Delete category?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                "{deleting.name}" will be permanently removed. This only works if it has no products.
              </p>
              {deleteError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleting(null)}
                  disabled={deleteInProgress}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteInProgress}
                >
                  {deleteInProgress ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
