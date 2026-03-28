import { useState, useEffect } from 'react';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CouponType,
} from '@/api/coupons';
import { getCampuses, type Campus } from '@/api/campuses';
import { getSettings, updateSettings } from '@/api/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, Plus } from 'lucide-react';

const IST = 'Asia/Kolkata';

/** Format stored ISO date as date + time in IST for display (e.g. "15 Mar 2025, 2:30 pm IST") */
function formatDateTimeIST(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: IST,
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: true,
    }) + ' IST';
  } catch {
    return iso;
  }
}

/** Convert stored ISO to "YYYY-MM-DDTHH:mm" for datetime-local input (IST) */
function toDateTimeLocalIST(iso: string): string {
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: IST,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return '';
  }
}

/** Parse "YYYY-MM-DDTHH:mm" from datetime-local as IST and return ISO string for API */
function dateTimeLocalISTToISO(value: string): string {
  if (!value || !value.includes('T')) return '';
  return new Date(value + ':00+05:30').toISOString();
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allowMultipleCoupons, setAllowMultipleCoupons] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('PERCENT');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [campusOnly, setCampusOnly] = useState(false);
  const [allowedCampusIds, setAllowedCampusIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Edit modal
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editType, setEditType] = useState<CouponType>('PERCENT');
  const [editValue, setEditValue] = useState('');
  const [editMinOrderAmount, setEditMinOrderAmount] = useState('');
  const [editMaxUses, setEditMaxUses] = useState('');
  const [editValidFrom, setEditValidFrom] = useState('');
  const [editValidTo, setEditValidTo] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCampusOnly, setEditCampusOnly] = useState(false);
  const [editAllowedCampusIds, setEditAllowedCampusIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete / deactivate
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [hardDeleteCoupon, setHardDeleteCoupon] = useState<Coupon | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadCoupons = () => {
    setLoading(true);
    setError(null);
    getCoupons()
      .then((res) => setCoupons(res.coupons))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    getCampuses()
      .then((res) => setCampuses(res.campuses))
      .catch(() => setCampuses([]));
  }, []);

  useEffect(() => {
    setSettingsLoading(true);
    getSettings()
      .then((res) => setAllowMultipleCoupons(res.allowMultipleCoupons))
      .catch(() => setAllowMultipleCoupons(false))
      .finally(() => setSettingsLoading(false));
  }, []);

  const handleAllowMultipleCouponsChange = (checked: boolean) => {
    setSettingsSaving(true);
    updateSettings({ allowMultipleCoupons: checked })
      .then((res) => setAllowMultipleCoupons(res.allowMultipleCoupons))
      .catch(() => {})
      .finally(() => setSettingsSaving(false));
  };

  const resetCreateForm = () => {
    setCode('');
    setType('PERCENT');
    setValue('');
    setMinOrderAmount('');
    setMaxUses('');
    setValidFrom('');
    setValidTo('');
    setCampusOnly(false);
    setAllowedCampusIds([]);
    setCreateError(null);
    setCreateOpen(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setCreateError('Code is required.');
      return;
    }
    if (type === 'FREE_SHIPPING') {
      // value not used
    } else {
      const valueNum = type === 'PERCENT' ? parseInt(value, 10) : parseFloat(value);
      const valuePaise = type === 'PERCENT'
        ? (Number.isNaN(valueNum) ? 0 : Math.min(100, Math.max(0, valueNum)))
        : Math.round((Number.isFinite(valueNum) ? valueNum : 0) * 100);
      if (type === 'PERCENT' ? (Number.isNaN(valueNum) || valueNum < 0 || valueNum > 100) : valuePaise < 0) {
        setCreateError(type === 'PERCENT' ? 'Percent (0-100) is required.' : 'Value (Rs) is required.');
        return;
      }
    }
    if (!validFrom || !validTo) {
      setCreateError('Valid from and valid to (date & time in IST) are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    const valueNum = type === 'PERCENT' ? parseInt(value, 10) : parseFloat(value);
    const valuePaise = type === 'PERCENT'
      ? (Number.isNaN(valueNum) ? 0 : Math.min(100, Math.max(0, valueNum)))
      : Math.round((Number.isFinite(valueNum) ? valueNum : 0) * 100);
    const minOrderPaise = minOrderAmount === '' ? null : Math.max(0, Math.round(parseFloat(minOrderAmount) * 100));
    createCoupon({
      code: code.trim().toUpperCase(),
      type,
      value: type === 'FREE_SHIPPING' ? 0 : (type === 'PERCENT' ? valueNum : valuePaise),
      minOrderAmount: minOrderPaise,
      maxUses: maxUses === '' ? null : Math.max(0, parseInt(maxUses, 10) || 0),
      validFrom: dateTimeLocalISTToISO(validFrom),
      validTo: dateTimeLocalISTToISO(validTo),
      campusOnly,
      allowedCampusIds: campusOnly ? allowedCampusIds : [],
    })
      .then(() => {
        resetCreateForm();
        loadCoupons();
      })
      .catch((err) => setCreateError(err instanceof Error ? err.message : 'Create failed'))
      .finally(() => setCreating(false));
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setEditCode(c.code);
    setEditType(c.type);
    setEditValue(c.type === 'FREE_SHIPPING' ? '' : c.type === 'PERCENT' ? String(c.value) : (c.value / 100).toFixed(2));
    setEditMinOrderAmount(c.minOrderAmount != null ? (c.minOrderAmount / 100).toFixed(2) : '');
    setEditMaxUses(c.maxUses != null ? String(c.maxUses) : '');
    setEditValidFrom(toDateTimeLocalIST(c.validFrom));
    setEditValidTo(toDateTimeLocalIST(c.validTo));
    setEditIsActive(c.isActive);
    setEditCampusOnly(c.campusOnly ?? false);
    setEditAllowedCampusIds(c.allowedCampusIds ?? []);
    setEditError(null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editCode.trim()) {
      setEditError('Code is required.');
      return;
    }
    if (editType !== 'FREE_SHIPPING') {
      const valueNum = editType === 'PERCENT' ? parseInt(editValue, 10) : parseFloat(editValue);
      const valuePaise = editType === 'PERCENT'
        ? (Number.isNaN(valueNum) ? 0 : Math.min(100, Math.max(0, valueNum)))
        : Math.round((Number.isFinite(valueNum) ? valueNum : 0) * 100);
      if (editType === 'PERCENT' ? (Number.isNaN(valueNum) || valueNum < 0 || valueNum > 100) : valuePaise < 0) {
        setEditError(editType === 'PERCENT' ? 'Percent (0-100) required.' : 'Value (Rs) required.');
        return;
      }
    }
    setUpdating(true);
    setEditError(null);
    const minOrderPaise = editMinOrderAmount === '' ? null : Math.max(0, Math.round(parseFloat(editMinOrderAmount) * 100));
    const valueNum = editType === 'PERCENT' ? parseInt(editValue, 10) : parseFloat(editValue);
    const valuePaise = editType === 'PERCENT'
      ? (Number.isNaN(valueNum) ? 0 : Math.min(100, Math.max(0, valueNum)))
      : Math.round((Number.isFinite(valueNum) ? valueNum : 0) * 100);
    updateCoupon(editing.id, {
      code: editCode.trim().toUpperCase(),
      type: editType,
      value: editType === 'FREE_SHIPPING' ? 0 : (editType === 'PERCENT' ? valueNum : valuePaise),
      minOrderAmount: minOrderPaise,
      maxUses: editMaxUses === '' ? null : Math.max(0, parseInt(editMaxUses, 10) || 0),
      validFrom: editValidFrom ? dateTimeLocalISTToISO(editValidFrom) : undefined,
      validTo: editValidTo ? dateTimeLocalISTToISO(editValidTo) : undefined,
      isActive: editIsActive,
      campusOnly: editCampusOnly,
      allowedCampusIds: editCampusOnly ? editAllowedCampusIds : [],
    })
      .then(() => {
        setEditing(null);
        loadCoupons();
      })
      .catch((err) => setEditError(err instanceof Error ? err.message : 'Update failed'))
      .finally(() => setUpdating(false));
  };

  const handleDeactivate = (id: string) => {
    setDeactivateId(id);
    setDeleteError(null);
    deleteCoupon(id, false)
      .then(() => loadCoupons())
      .catch((err) => setDeleteError(err instanceof Error ? err.message : 'Deactivate failed'))
      .finally(() => setDeactivateId(null));
  };

  const openHardDelete = (c: Coupon) => setHardDeleteCoupon(c);
  const handleHardDelete = () => {
    if (!hardDeleteCoupon) return;
    setDeleteInProgress(true);
    setDeleteError(null);
    deleteCoupon(hardDeleteCoupon.id, true)
      .then(() => {
        setHardDeleteCoupon(null);
        loadCoupons();
      })
      .catch((err) => setDeleteError(err instanceof Error ? err.message : 'Delete failed'))
      .finally(() => setDeleteInProgress(false));
  };

  const formatValue = (c: Coupon) =>
    c.type === 'FREE_SHIPPING' ? 'Free shipping' : c.type === 'PERCENT' ? `${c.value}%` : `₹${(c.value / 100).toFixed(2)}`;

  const typeBadgeVariant = (t: CouponType) => {
    if (t === 'PERCENT') return 'purple' as const;
    if (t === 'FIXED') return 'info' as const;
    return 'warning' as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
        </div>
        <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Create coupon
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Coupon settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Coupon settings</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <Skeleton className="h-5 w-64" />
          ) : (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={allowMultipleCoupons}
                  onChange={(e) => handleAllowMultipleCouponsChange(e.target.checked)}
                  disabled={settingsSaving}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </div>
              <span className="text-sm text-muted-foreground">Allow customers to use multiple coupon codes per order</span>
              {settingsSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            </label>
          )}
        </CardContent>
      </Card>

      {/* Coupons table */}
      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-4 w-24 ml-auto" />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valid from (IST)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valid to (IST)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Used</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Max uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground font-mono">{c.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant={typeBadgeVariant(c.type)}>{c.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">{formatValue(c)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTimeIST(c.validFrom)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTimeIST(c.validTo)}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">{c.usedCount}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-right">{c.maxUses ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'success' : 'secondary'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      {c.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-800"
                          onClick={() => handleDeactivate(c.id)}
                          disabled={deactivateId === c.id}
                        >
                          {deactivateId === c.id ? '...' : 'Deactivate'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openHardDelete(c)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coupons.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">No coupons yet.</div>
            )}
          </div>
        </Card>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !creating && resetCreateForm()}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Create coupon</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Code *</span>
                  <Input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="mt-1 font-mono" placeholder="SAVE10" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">Type</span>
                    <select value={type} onChange={(e) => setType(e.target.value as CouponType)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="PERCENT">Percent</option>
                      <option value="FIXED">Fixed (Rs)</option>
                      <option value="FREE_SHIPPING">Free shipping</option>
                    </select>
                  </label>
                  {type !== 'FREE_SHIPPING' && (
                    <label className="block">
                      <span className="text-sm font-medium text-muted-foreground">Value *</span>
                      <Input type="number" min={0} max={type === 'PERCENT' ? 100 : undefined} step={type === 'PERCENT' ? 1 : 0.01} value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" placeholder={type === 'PERCENT' ? '10' : '50.00'} />
                    </label>
                  )}
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Min order (Rs, optional)</span>
                  <Input type="number" min={0} step="0.01" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className="mt-1" placeholder="--" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Max uses (optional)</span>
                  <Input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1" placeholder="--" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Valid from * (IST)</span>
                  <Input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required className="mt-1" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Valid to * (IST)</span>
                  <Input type="datetime-local" value={validTo} onChange={(e) => setValidTo(e.target.value)} required className="mt-1" />
                </label>
                {/* Campus only toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={campusOnly}
                      onChange={(e) => setCampusOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Campus only (valid only for campus delivery orders)</span>
                </label>
                {campusOnly && campuses.length > 0 && (
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">Allowed campuses (leave empty = any campus)</span>
                    <select
                      multiple
                      value={allowedCampusIds}
                      onChange={(e) => setAllowedCampusIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                      className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
                    >
                      {campuses.map((cam) => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetCreateForm} disabled={creating}>Cancel</Button>
                  <Button type="submit" disabled={creating}>
                    <Plus className="h-4 w-4 mr-1" />
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !updating && setEditing(null)}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Edit coupon</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                {editError && <p className="text-sm text-destructive">{editError}</p>}
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Code *</span>
                  <Input type="text" value={editCode} onChange={(e) => setEditCode(e.target.value.toUpperCase())} required className="mt-1 font-mono" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">Type</span>
                    <select value={editType} onChange={(e) => setEditType(e.target.value as CouponType)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="PERCENT">Percent</option>
                      <option value="FIXED">Fixed (Rs)</option>
                      <option value="FREE_SHIPPING">Free shipping</option>
                    </select>
                  </label>
                  {editType !== 'FREE_SHIPPING' && (
                    <label className="block">
                      <span className="text-sm font-medium text-muted-foreground">Value *</span>
                      <Input type="number" min={0} max={editType === 'PERCENT' ? 100 : undefined} step={editType === 'PERCENT' ? 1 : 0.01} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-1" placeholder={editType === 'PERCENT' ? '10' : '50.00'} />
                    </label>
                  )}
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Min order (Rs)</span>
                  <Input type="number" min={0} step="0.01" value={editMinOrderAmount} onChange={(e) => setEditMinOrderAmount(e.target.value)} className="mt-1" placeholder="--" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Max uses</span>
                  <Input type="number" min={0} value={editMaxUses} onChange={(e) => setEditMaxUses(e.target.value)} className="mt-1" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Valid from (IST)</span>
                  <Input type="datetime-local" value={editValidFrom} onChange={(e) => setEditValidFrom(e.target.value)} className="mt-1" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-muted-foreground">Valid to (IST)</span>
                  <Input type="datetime-local" value={editValidTo} onChange={(e) => setEditValidTo(e.target.value)} className="mt-1" />
                </label>
                {/* Active toggle */}
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
                  <span className="text-sm text-muted-foreground">Active</span>
                </label>
                {/* Campus only toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={editCampusOnly}
                      onChange={(e) => setEditCampusOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </div>
                  <span className="text-sm text-muted-foreground">Campus only (valid only for campus delivery orders)</span>
                </label>
                {editCampusOnly && campuses.length > 0 && (
                  <label className="block">
                    <span className="text-sm font-medium text-muted-foreground">Allowed campuses (empty = any campus)</span>
                    <select
                      multiple
                      value={editAllowedCampusIds}
                      onChange={(e) => setEditAllowedCampusIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                      className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
                    >
                      {campuses.map((cam) => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={updating}>Cancel</Button>
                  <Button type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hard delete confirm */}
      {hardDeleteCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deleteInProgress && setHardDeleteCoupon(null)}>
          <Card className="w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Permanently delete?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Coupon &quot;{hardDeleteCoupon.code}&quot; will be removed. This cannot be undone.</p>
              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setHardDeleteCoupon(null)} disabled={deleteInProgress}>Cancel</Button>
                <Button type="button" variant="destructive" onClick={handleHardDelete} disabled={deleteInProgress}>
                  {deleteInProgress ? 'Deleting...' : 'Delete permanently'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
