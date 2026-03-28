import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Truck, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { getSettings, updateSettings } from '@/api/settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function paiseTo(paise: number): string {
  return (paise / 100).toString();
}

function toPaise(rupees: string): number {
  return Math.round((parseFloat(rupees) || 0) * 100);
}

export function SettingsPage() {
  const [allowMultipleCoupons, setAllowMultipleCoupons] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState('499');
  const [lowThreshold, setLowThreshold] = useState('200');
  const [chargeBelow, setChargeBelow] = useState('50');
  const [chargeAbove, setChargeAbove] = useState('100');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setAllowMultipleCoupons(s.allowMultipleCoupons);
        setFreeThreshold(paiseTo(s.shipping.freeThresholdPaise));
        setLowThreshold(paiseTo(s.shipping.lowThresholdPaise));
        setChargeBelow(paiseTo(s.shipping.chargeBelowLowPaise));
        setChargeAbove(paiseTo(s.shipping.chargeAboveLowPaise));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const freePaise = toPaise(freeThreshold);
    const lowPaise = toPaise(lowThreshold);

    if (freePaise <= lowPaise) {
      setError('Free shipping threshold must be greater than the low tier boundary.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await updateSettings({
        allowMultipleCoupons,
        shipping: {
          freeThresholdPaise: freePaise,
          lowThresholdPaise: lowPaise,
          chargeBelowLowPaise: toPaise(chargeBelow),
          chargeAboveLowPaise: toPaise(chargeAbove),
        },
      });
      setAllowMultipleCoupons(res.allowMultipleCoupons);
      setFreeThreshold(paiseTo(res.shipping.freeThresholdPaise));
      setLowThreshold(paiseTo(res.shipping.lowThresholdPaise));
      setChargeBelow(paiseTo(res.shipping.chargeBelowLowPaise));
      setChargeAbove(paiseTo(res.shipping.chargeAboveLowPaise));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-7 w-[120px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[130px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Settings saved.
        </motion.div>
      )}

      {/* Checkout settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Checkout</CardTitle>
          </div>
          <CardDescription>Configure checkout behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={allowMultipleCoupons}
                onChange={(e) => setAllowMultipleCoupons(e.target.checked)}
                className="sr-only peer"
              />
              <div className={cn(
                'h-5 w-9 rounded-full transition-colors',
                allowMultipleCoupons ? 'bg-primary' : 'bg-muted-foreground/25'
              )} />
              <div className={cn(
                'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                allowMultipleCoupons && 'translate-x-4'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Allow multiple coupons per order</p>
              <p className="text-xs text-muted-foreground mt-1">
                When enabled, customers can stack multiple coupon codes on a single order.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Shipping tiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Shipping tiers</CardTitle>
          </div>
          <CardDescription>
            Configure shipping charges based on cart value. Campus delivery is always free.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Free shipping above (&#x20B9;)</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Low tier boundary (&#x20B9;)</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Cart below this pays the lower charge</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Charge below &#x20B9;{lowThreshold || '0'} (&#x20B9;)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={chargeBelow}
                onChange={(e) => setChargeBelow(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Charge &#x20B9;{lowThreshold || '0'} &ndash; &#x20B9;{freeThreshold || '0'} (&#x20B9;)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={chargeAbove}
                onChange={(e) => setChargeAbove(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Live preview */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Live Preview</p>
            <div className="text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cart under &#x20B9;{lowThreshold || '0'}</span>
                <Badge variant="warning">&#x20B9;{chargeBelow || '0'} shipping</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Cart &#x20B9;{lowThreshold || '0'} &ndash; &#x20B9;{freeThreshold || '0'}
                </span>
                <Badge variant="info">&#x20B9;{chargeAbove || '0'} shipping</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cart &#x20B9;{freeThreshold || '0'}+</span>
                <Badge variant="success">Free shipping</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save settings'
          )}
        </Button>
      </div>
    </motion.div>
  );
}
