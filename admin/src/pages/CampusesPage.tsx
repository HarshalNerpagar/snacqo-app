import { useState, useEffect } from 'react';
import {
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  type Campus,
} from '@/api/campuses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus } from 'lucide-react';

export function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addName, setAddName] = useState('');
  const [addLine1, setAddLine1] = useState('');
  const [addLine2, setAddLine2] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addState, setAddState] = useState('');
  const [addPincode, setAddPincode] = useState('');
  const [addSortOrder, setAddSortOrder] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Campus | null>(null);
  const [editName, setEditName] = useState('');
  const [editLine1, setEditLine1] = useState('');
  const [editLine2, setEditLine2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Campus | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCampuses = () => {
    setLoading(true);
    setError(null);
    getCampuses()
      .then((res) => setCampuses(res.campuses))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load campuses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampuses();
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addLine1.trim() || !addCity.trim() || !addState.trim() || !addPincode.trim()) return;
    setAdding(true);
    setAddError(null);
    createCampus({
      name: addName.trim(),
      line1: addLine1.trim(),
      line2: addLine2.trim() || null,
      city: addCity.trim(),
      state: addState.trim(),
      pincode: addPincode.trim(),
      sortOrder: addSortOrder,
    })
      .then(() => {
        setAddName('');
        setAddLine1('');
        setAddLine2('');
        setAddCity('');
        setAddState('');
        setAddPincode('');
        setAddSortOrder(0);
        loadCampuses();
      })
      .catch((err) => setAddError(err instanceof Error ? err.message : 'Failed to create'))
      .finally(() => setAdding(false));
  };

  const openEdit = (c: Campus) => {
    setEditing(c);
    setEditName(c.name);
    setEditLine1(c.line1);
    setEditLine2(c.line2 ?? '');
    setEditCity(c.city);
    setEditState(c.state);
    setEditPincode(c.pincode);
    setEditIsActive(c.isActive);
    setEditSortOrder(c.sortOrder);
    setEditError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setUpdating(true);
    setEditError(null);
    updateCampus(editing.id, {
      name: editName.trim(),
      line1: editLine1.trim(),
      line2: editLine2.trim() || null,
      city: editCity.trim(),
      state: editState.trim(),
      pincode: editPincode.trim(),
      isActive: editIsActive,
      sortOrder: editSortOrder,
    })
      .then(() => {
        setEditing(null);
        loadCampuses();
      })
      .catch((err) => setEditError(err instanceof Error ? err.message : 'Failed to update'))
      .finally(() => setUpdating(false));
  };

  const openDelete = (c: Campus) => {
    setDeleting(c);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    setDeleteInProgress(true);
    setDeleteError(null);
    deleteCampus(deleting.id)
      .then(() => {
        setDeleting(null);
        loadCampuses();
      })
      .catch((err) => setDeleteError(err instanceof Error ? err.message : 'Failed to delete'))
      .finally(() => setDeleteInProgress(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campuses</h1>
          <p className="text-sm text-muted-foreground">
            Campuses where you deliver. Customers who select campus delivery get free shipping. Add at least one campus to enable campus delivery at checkout.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add campus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit} className="space-y-3 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <Input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Rishihood University"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Sort order</span>
                <Input
                  type="number"
                  min={0}
                  value={addSortOrder}
                  onChange={(e) => setAddSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-24"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Address line 1</span>
              <Input
                type="text"
                value={addLine1}
                onChange={(e) => setAddLine1(e.target.value)}
                placeholder="Building / area"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Address line 2 (optional)</span>
              <Input
                type="text"
                value={addLine2}
                onChange={(e) => setAddLine2(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">City</span>
                <Input
                  type="text"
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">State</span>
                <Input
                  type="text"
                  value={addState}
                  onChange={(e) => setAddState(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Pincode</span>
                <Input
                  type="text"
                  value={addPincode}
                  onChange={(e) => setAddPincode(e.target.value)}
                />
              </label>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <Button
              type="submit"
              disabled={adding || !addName.trim() || !addLine1.trim() || !addCity.trim() || !addState.trim() || !addPincode.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {adding ? 'Adding...' : 'Add campus'}
            </Button>
          </form>
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-5 w-16 rounded-full" />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campuses.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {c.line1}
                      {c.line2 ? `, ${c.line2}` : ''}, {c.city}, {c.state} {c.pincode}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'success' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(c)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campuses.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No campuses yet. Add one to enable campus delivery.</div>
            )}
          </div>
        </Card>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !updating && setEditing(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit campus</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Name</span>
                  <Input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Address line 1</span>
                  <Input type="text" value={editLine1} onChange={(e) => setEditLine1(e.target.value)} className="mt-1" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Address line 2 (optional)</span>
                  <Input type="text" value={editLine2} onChange={(e) => setEditLine2(e.target.value)} className="mt-1" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">City</span>
                    <Input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="mt-1" required />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">State</span>
                    <Input type="text" value={editState} onChange={(e) => setEditState(e.target.value)} className="mt-1" required />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Pincode</span>
                  <Input type="text" value={editPincode} onChange={(e) => setEditPincode(e.target.value)} className="mt-1 w-32" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Sort order</span>
                  <Input type="number" min={0} value={editSortOrder} onChange={(e) => setEditSortOrder(parseInt(e.target.value, 10) || 0)} className="mt-1 w-24" />
                </label>
                {/* Toggle switch for isActive */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Active (shown at checkout)</span>
                </label>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={updating}>
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
              <CardTitle>Delete campus?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">"{deleting.name}" will be removed. Customers will no longer see it at checkout.</p>
              {deleteError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                  {deleteError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={deleteInProgress}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={deleteInProgress}>
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
