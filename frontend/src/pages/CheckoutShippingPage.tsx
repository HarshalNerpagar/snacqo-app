import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { SavedAddressPicker } from '@/components/checkout/SavedAddressPicker';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { EmailVerificationModal } from '@/components/checkout/EmailVerificationModal';
import { getCart, getCartSummary, type CartItemResponse, type CartSummaryResponse } from '@/api/cart';
import { createOrder, createPaymentOrder, verifyPayment, cancelOrder, formatPrice } from '@/api/orders';
import { listAddresses, createAddress, type AddressResponse } from '@/api/addresses';
import { getCampuses, type CampusResponse } from '@/api/campuses';
import { getSettings } from '@/api/settings';
import { useCart } from '@/contexts/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { loadRazorpayScript } from '@/utils/razorpay';
import type { ShippingFormData } from '@/types/checkout';
import type { CheckoutOrderItem } from '@/types/checkout';

function mapToCheckoutItem(item: CartItemResponse): CheckoutOrderItem {
  const v = item.variant;
  const product = v?.product;
  const pricePaise = v?.price ?? 0;
  return {
    id: item.id,
    name: product?.name ?? '',
    variant: v?.name ?? '',
    imageUrl: product?.images?.[0]?.url ?? '',
    quantity: item.quantity,
    price: formatPrice(pricePaise),
    pricePaise,
  };
}

function useNeedsEmailVerification() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  return {
    isVerifiedFor: (email: string) => Boolean(email && verifiedEmail === email),
    setVerified: (email: string) => setVerifiedEmail(email),
  };
}

function nameToFirstLast(name: string): { first: string; last: string } {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function CampusDeliveryForm({
  initialEmail,
  initialFirstName,
  initialLastName,
  initialPhone,
  onSubmit,
  isSubmitting,
  canSubmit,
}: {
  initialEmail: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialPhone?: string;
  onSubmit: (data: ShippingFormData) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState(initialFirstName ?? '');
  const [lastName, setLastName] = useState(initialLastName ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const hasAppliedInitialRef = useRef(false);

  useEffect(() => {
    const hasInitial = initialFirstName !== undefined || initialLastName !== undefined || initialPhone !== undefined;
    if (hasInitial && !hasAppliedInitialRef.current) {
      if (initialFirstName !== undefined) setFirstName(initialFirstName);
      if (initialLastName !== undefined) setLastName(initialLastName);
      if (initialPhone !== undefined) setPhone(initialPhone);
      hasAppliedInitialRef.current = true;
    }
    if (!hasInitial) hasAppliedInitialRef.current = false;
  }, [initialFirstName, initialLastName, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: phone.trim(),
      saveInfo: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 border-4 border-text-chocolate shadow-[8px_8px_0px_0px_#2D1B0E] space-y-4">
      <div>
        <label className="block font-extrabold text-sm uppercase tracking-wide text-text-chocolate mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border-2 border-text-chocolate px-3 py-2 font-bold text-text-chocolate"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-extrabold text-sm uppercase tracking-wide text-text-chocolate mb-1">First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-md border-2 border-text-chocolate px-3 py-2 font-bold text-text-chocolate"
          />
        </div>
        <div>
          <label className="block font-extrabold text-sm uppercase tracking-wide text-text-chocolate mb-1">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border-2 border-text-chocolate px-3 py-2 font-bold text-text-chocolate"
          />
        </div>
      </div>
      <div>
        <label className="block font-extrabold text-sm uppercase tracking-wide text-text-chocolate mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="10-digit mobile"
          className="w-full rounded-md border-2 border-text-chocolate px-3 py-2 font-bold text-text-chocolate"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="w-full py-3 bg-accent-mango text-text-chocolate font-bold border-2 border-text-chocolate shadow-[4px_4px_0px_0px_#2D1B0E] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2D1B0E] transition-all uppercase tracking-wider btn-text disabled:opacity-50"
      >
        {isSubmitting ? 'Processing…' : 'Proceed to payment'}
      </button>
    </form>
  );
}

export function CheckoutShippingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { isVerifiedFor, setVerified } = useNeedsEmailVerification();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ShippingFormData | null>(null);
  const [pendingCampusOptions, setPendingCampusOptions] = useState<{ isCampus: boolean; campusId: string } | null>(null);

  const [items, setItems] = useState<CheckoutOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allowMultipleCoupons, setAllowMultipleCoupons] = useState(false);
  type AppliedCoupon = { code: string; discountAmount: number; freeShipping: boolean; message: string };
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const { refreshCart } = useCart();

  // Server-computed pricing summary — never compute prices on the frontend
  const [priceSummary, setPriceSummary] = useState<CartSummaryResponse['summary'] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Saved addresses (logged-in users only)
  const [savedAddresses, setSavedAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressMode, setAddressMode] = useState<'picker' | 'form'>('picker');

  // Delivery type: standard (address) vs campus
  const [deliveryType, setDeliveryType] = useState<'standard' | 'campus'>('standard');
  const [campuses, setCampuses] = useState<CampusResponse[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  const isCampusDelivery = deliveryType === 'campus' && !!selectedCampusId;

  // Fetch server-computed pricing summary whenever anything price-relevant changes.
  // This is the Shopify/Swiggy pattern: backend is the single source of truth for all prices.
  const fetchSummary = useCallback(async (
    couponCodes: string[],
    isCampus: boolean,
    campusId: string,
  ) => {
    setSummaryLoading(true);
    try {
      const { summary } = await getCartSummary({
        couponCodes: couponCodes.length > 0 ? couponCodes : undefined,
        isCampusOrder: isCampus || undefined,
        campusId: campusId || undefined,
      });
      setPriceSummary(summary);
    } catch {
      // Non-fatal — keep showing previous summary
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Initial load: cart items + addresses + settings + campuses
  useEffect(() => {
    const cartReq = getCart()
      .then(({ cart }) => {
        const list = (cart?.items ?? []) as CartItemResponse[];
        setItems(list.map(mapToCheckoutItem));
      })
      .catch(() => setItems([]));

    const addrReq = isLoggedIn
      ? listAddresses()
          .then(({ addresses }) => {
            setSavedAddresses(addresses);
            if (addresses.length > 0) {
              const def = addresses.find((a) => a.isDefault) ?? addresses[0];
              setSelectedAddressId(def.id);
              setAddressMode('picker');
            } else {
              setAddressMode('form');
            }
          })
          .catch(() => setAddressMode('form'))
      : Promise.resolve();

    const settingsReq = getSettings()
      .then((s) => setAllowMultipleCoupons(s.allowMultipleCoupons))
      .catch(() => setAllowMultipleCoupons(false));

    const campusesReq = getCampuses()
      .then(({ campuses: c }) => setCampuses(c))
      .catch(() => setCampuses([]));

    // Initial price summary (no coupons, standard delivery)
    const summaryReq = fetchSummary([], false, '');

    Promise.all([cartReq, addrReq, settingsReq, campusesReq, summaryReq]).finally(() => setLoading(false));
  }, [isLoggedIn, fetchSummary]);

  // When the user logs in via OTP on this page, refresh both the cart context (so the
  // header count is correct) and the price summary (so the merged cart's total is shown).
  // Also reset applied coupons — they were validated against the pre-login subtotal and
  // must be re-validated against the merged cart.
  const prevIsLoggedIn = useRef(isLoggedIn);
  useEffect(() => {
    if (!prevIsLoggedIn.current && isLoggedIn) {
      // Auth state changed: guest → logged in
      refreshCart();
      setAppliedCoupons([]);
      setCouponMessage('Your cart was updated after login. Please re-apply any coupon.');
      fetchSummary([], isCampusDelivery, selectedCampusId);
    }
    prevIsLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, refreshCart, fetchSummary, isCampusDelivery, selectedCampusId]);

  // Re-fetch summary whenever delivery type or campus changes (shipping amount may change)
  useEffect(() => {
    fetchSummary(
      appliedCoupons.map((c) => c.code),
      isCampusDelivery,
      selectedCampusId,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCampusDelivery, selectedCampusId]);

  // Derived display values from server summary (never computed locally)
  const subtotalStr = priceSummary ? formatPrice(priceSummary.subtotal) : '…';
  const totalStr = priceSummary ? formatPrice(priceSummary.total) : '…';
  const discountStr = priceSummary && priceSummary.discountAmount > 0 ? formatPrice(priceSummary.discountAmount) : undefined;
  const shippingStr = priceSummary
    ? priceSummary.isFreeShipping
      ? 'Free'
      : formatPrice(priceSummary.shippingAmount)
    : '…';

  const handleApplyCoupon = async (code: string) => {
    setCouponMessage(null);
    const codeUpper = code.trim().toUpperCase();
    if (appliedCoupons.some((c) => c.code.toUpperCase() === codeUpper)) {
      setCouponMessage('This coupon is already applied.');
      return;
    }

    const nextCoupons = allowMultipleCoupons
      ? [...appliedCoupons.map((c) => c.code), codeUpper]
      : [codeUpper];

    // Validate by fetching the server summary with the new coupon list
    try {
      const { summary } = await getCartSummary({
        couponCodes: nextCoupons,
        isCampusOrder: isCampusDelivery || undefined,
        campusId: selectedCampusId || undefined,
      });

      const msg = summary.couponMessages.find((m) => m.code === codeUpper);
      if (!msg?.valid) {
        setCouponMessage(msg?.message ?? 'Invalid coupon.');
        return;
      }

      // All coupons in nextCoupons are valid — update state and summary together
      setPriceSummary(summary);
      if (allowMultipleCoupons) {
        setAppliedCoupons((prev) => [
          ...prev,
          { code: codeUpper, discountAmount: 0, freeShipping: false, message: msg.message },
        ]);
      } else {
        setAppliedCoupons([{ code: codeUpper, discountAmount: 0, freeShipping: false, message: msg.message }]);
      }
      setCouponMessage(msg.message);
    } catch {
      setCouponMessage('Could not validate coupon.');
    }
  };

  const handleRemoveCoupon = async (code: string) => {
    const next = appliedCoupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    setAppliedCoupons(next);
    setCouponMessage(null);
    // Re-fetch summary without the removed coupon
    await fetchSummary(next.map((c) => c.code), isCampusDelivery, selectedCampusId);
  };

  const addressToFormData = (addr: AddressResponse): ShippingFormData => {
    const nameParts = addr.name.trim().split(' ');
    return {
      email: user?.email ?? '',
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' '),
      address: addr.line1,
      city: addr.city,
      state: addr.state,
      zipCode: addr.pincode,
      phone: addr.phone,
      saveInfo: false,
    };
  };

  const handleUseSavedAddress = () => {
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    proceedToPayment(addressToFormData(addr));
  };

  const handleSubmit = (data: ShippingFormData) => {
    if (isLoggedIn || isVerifiedFor(data.email)) {
      proceedToPayment(data);
      return;
    }
    setPendingFormData(data);
    setShowEmailModal(true);
  };

  const proceedToPayment = async (data: ShippingFormData, options?: { isCampus: boolean; campusId: string }) => {
    setError(null);
    setSubmitting(true);

    const isCampus = options?.isCampus && options?.campusId;

    if (data.saveInfo && isLoggedIn && !isCampus) {
      try {
        await createAddress({
          label: 'Home',
          name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
          phone: data.phone.trim(),
          line1: data.address.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          pincode: data.zipCode.trim(),
          isDefault: true,
        });
      } catch {
        // Non-fatal
      }
    }

    try {
      const orderPayload = isCampus
        ? {
            email: data.email.trim().toLowerCase(),
            deliveryType: 'CAMPUS' as const,
            campusId: options!.campusId,
            shippingName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
            shippingPhone: data.phone.trim(),
            ...(appliedCoupons.length > 0 ? { couponCodes: appliedCoupons.map((c) => c.code) } : {}),
          }
        : {
            email: data.email.trim().toLowerCase(),
            shippingName: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
            shippingPhone: data.phone.trim(),
            shippingLine1: data.address.trim(),
            shippingLine2: null,
            shippingCity: data.city.trim(),
            shippingState: data.state.trim(),
            shippingPincode: data.zipCode.trim(),
            ...(appliedCoupons.length > 0 ? { couponCodes: appliedCoupons.map((c) => c.code) } : {}),
          };

      const res = await createOrder(orderPayload);
      const orderId = res.order.id;
      const orderNumber = res.order.orderNumber;
      const email = data.email;
      const shippingName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      // Detect price discrepancy between what the user saw and what the backend computed.
      // This can happen if a product price changed or the cart was modified in another tab.
      if (priceSummary && res.order.total !== priceSummary.total) {
        const serverTotal = formatPrice(res.order.total);
        const displayedTotal = formatPrice(priceSummary.total);
        // Update the displayed summary to match the authoritative backend total
        setPriceSummary((prev) =>
          prev
            ? {
                ...prev,
                subtotal: res.order.subtotal,
                shippingAmount: res.order.shippingAmount,
                discountAmount: res.order.discountAmount,
                total: res.order.total,
              }
            : prev
        );
        console.warn(`[checkout] Price updated: displayed ${displayedTotal} → charged ${serverTotal}`);
      }

      let paymentConfig: Awaited<ReturnType<typeof createPaymentOrder>>;
      try {
        paymentConfig = await createPaymentOrder(orderId);
      } catch (e) {
        try { await cancelOrder(orderId); } catch { /* best-effort */ }
        setSubmitting(false);
        setError(e instanceof Error ? e.message : 'Could not start payment. Please try again.');
        return;
      }

      await loadRazorpayScript();
      const Razorpay = window.Razorpay!;

      const handleCancel = async (reason: 'cancelled' | 'failed') => {
        try {
          await cancelOrder(orderId);
          await refreshCart();
          // Restore summary after cart is restored
          await fetchSummary(appliedCoupons.map((c) => c.code), isCampusDelivery, selectedCampusId);
        } catch { /* best-effort */ }
        setSubmitting(false);
        if (reason === 'cancelled') {
          setError('Payment was cancelled. Your cart has been restored — try again when ready.');
        } else {
          setError('Payment failed. Your cart has been restored — try again or use a different payment method.');
        }
      };

      const rzp = new Razorpay({
        key: paymentConfig.key,
        amount: paymentConfig.amount,   // Always from the backend — never from local state
        currency: paymentConfig.currency,
        order_id: paymentConfig.razorpayOrderId,
        name: 'snacQO',
        description: `Order ${orderNumber}`,
        prefill: { name: shippingName, email, contact: data.phone.trim() },
        notes: { orderId, orderNumber },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment(orderId, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshCart();
            navigate('/order-confirmed', { state: { orderId, orderNumber, email } });
          } catch {
            setError('Payment verification failed. Please contact support with order number: ' + orderNumber);
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => { handleCancel('cancelled'); },
        },
      });
      rzp.on('payment.failed', () => { handleCancel('failed'); });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order.');
      setSubmitting(false);
    }
  };

  const handleEmailVerified = async () => {
    if (!pendingFormData) return;
    setVerified(pendingFormData.email);
    setShowEmailModal(false);
    // Refresh cart context so header count reflects the post-login merged cart
    await refreshCart();
    proceedToPayment(pendingFormData, pendingCampusOptions ?? undefined);
    setPendingFormData(null);
    setPendingCampusOptions(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <>
      {showEmailModal && pendingFormData && (
        <EmailVerificationModal
          email={pendingFormData.email}
          firstName={pendingFormData.firstName}
          lastName={pendingFormData.lastName}
          onVerify={handleEmailVerified}
          onClose={() => {
            setShowEmailModal(false);
            setPendingFormData(null);
            setPendingCampusOptions(null);
          }}
        />
      )}
      <span
        className="absolute top-32 left-10 z-0 hidden lg:block opacity-50 material-symbols-outlined text-6xl text-accent-strawberry rotate-12"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        local_shipping
      </span>
      <span
        className="absolute bottom-20 right-20 z-0 hidden lg:block opacity-50 material-symbols-outlined text-8xl text-accent-mango -rotate-12"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        shopping_bag
      </span>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary text-white w-10 h-10 flex items-center justify-center border-2 border-text-chocolate shadow-[3px_3px_0px_0px_#2D1B0E] font-black text-xl rotate-[-3deg]">
              1
            </div>
            <h2 className="text-3xl md:text-4xl text-text-chocolate brand-font uppercase tracking-tight">
              Shipping Deets
            </h2>
          </div>
          {error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-2 font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            <span className="font-extrabold text-sm uppercase tracking-wide text-text-chocolate">Delivery type</span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'standard'}
                  onChange={() => setDeliveryType('standard')}
                  className="w-4 h-4 text-primary border-2 border-text-chocolate"
                />
                <span className="font-bold text-text-chocolate">Deliver to my address</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === 'campus'}
                  onChange={() => { setDeliveryType('campus'); setSelectedCampusId(campuses[0]?.id ?? ''); }}
                  className="w-4 h-4 text-primary border-2 border-text-chocolate"
                />
                <span className="font-bold text-text-chocolate">Campus delivery (free shipping)</span>
              </label>
            </div>
          </div>

          {deliveryType === 'campus' ? (
            <div className="space-y-6">
              <div>
                <label className="block font-extrabold text-sm uppercase tracking-wide text-text-chocolate mb-2">Select campus</label>
                <select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="w-full rounded-md border-2 border-text-chocolate px-3 py-2 font-bold text-text-chocolate bg-white"
                >
                  <option value="">Choose a campus</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {selectedCampusId && (() => {
                  const campus = campuses.find((c) => c.id === selectedCampusId);
                  return campus ? (
                    <p className="mt-2 text-sm text-text-chocolate/80 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      <strong>Note:</strong> Selecting this option means your delivery location is <strong>{campus.name}</strong> — {campus.line1}, {campus.city}, {campus.state} {campus.pincode}.
                    </p>
                  ) : null;
                })()}
              </div>
              <CampusDeliveryForm
                initialEmail={user?.email ?? ''}
                initialFirstName={isLoggedIn && savedAddresses.length > 0 ? nameToFirstLast((savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]).name).first : undefined}
                initialLastName={isLoggedIn && savedAddresses.length > 0 ? nameToFirstLast((savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]).name).last : undefined}
                initialPhone={isLoggedIn && savedAddresses.length > 0 ? (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]).phone : undefined}
                onSubmit={(data) => {
                  if (isLoggedIn || isVerifiedFor(data.email)) {
                    proceedToPayment(data, { isCampus: true, campusId: selectedCampusId });
                  } else {
                    setPendingFormData(data);
                    setPendingCampusOptions({ isCampus: true, campusId: selectedCampusId });
                    setShowEmailModal(true);
                  }
                }}
                isSubmitting={submitting}
                canSubmit={!!selectedCampusId}
              />
            </div>
          ) : isLoggedIn && savedAddresses.length > 0 && addressMode === 'picker' ? (
            <SavedAddressPicker
              addresses={savedAddresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onUseSelected={handleUseSavedAddress}
              onAddNew={() => setAddressMode('form')}
              isSubmitting={submitting}
            />
          ) : (
            <>
              {isLoggedIn && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddressMode('picker')}
                  className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-primary hover:underline mb-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Use a saved address
                </button>
              )}
              <ShippingForm
                onSubmit={handleSubmit}
                isSubmitting={submitting}
                initialData={isLoggedIn ? { email: user?.email ?? '' } : undefined}
              />
            </>
          )}
        </div>
        <div className="lg:col-span-5 relative">
          <CheckoutOrderSummary
            items={items}
            subtotal={subtotalStr}
            total={totalStr}
            shippingAmount={shippingStr}
            appliedCoupons={appliedCoupons}
            discountAmount={discountStr}
            couponMessage={couponMessage ?? undefined}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            summaryLoading={summaryLoading}
          />
        </div>
      </div>
    </>
  );
}
