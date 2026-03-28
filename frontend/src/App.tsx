import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/Layout';
import { Marquee } from '@/components/Marquee';
import { Hero } from '@/components/Hero';
import { Flavors } from '@/components/Flavors';
import { VibeCheck } from '@/components/VibeCheck';
import { Contact } from '@/components/Contact';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { TermsAndConditions } from '@/pages/TermsAndConditions';
import { ReturnRefundPolicy } from '@/pages/ReturnRefundPolicy';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutShippingPage } from '@/pages/CheckoutShippingPage';
import { OrderConfirmedPage } from '@/pages/OrderConfirmedPage';
import { AccountLayout } from '@/components/AccountLayout';
import { AccountOverviewPage } from '@/pages/account/AccountOverviewPage';
import { SavedAddressesPage } from '@/pages/account/SavedAddressesPage';
import { OrderHistoryPage } from '@/pages/account/OrderHistoryPage';
import { AccountProfilePage } from '@/pages/account/AccountProfilePage';
import { CheckoutLayout } from '@/components/CheckoutLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { AboutPage } from '@/pages/AboutPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [hash]);

  return (
    <>
      {/* Decorative icons */}
      <span
        className="absolute top-32 left-10 z-0 hidden lg:block material-symbols-outlined text-6xl text-accent-strawberry rotate-12"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        star
      </span>
      <span
        className="absolute top-48 right-20 z-0 hidden lg:block material-symbols-outlined text-5xl text-accent-mango -rotate-12 animate-pulse"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden
      >
        bolt
      </span>
      <Hero />
      <Marquee variant="middle" />
      <Flavors />
      <VibeCheck />
      <Contact />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
        <Route path="/return-refund-policy" element={<Layout><ReturnRefundPolicy /></Layout>} />
        <Route path="/shop" element={<Layout><ProductsPage /></Layout>} />
        <Route path="/shop/:slug" element={<Layout><ProductDetailPage /></Layout>} />
        <Route path="/cart" element={<Layout><CartPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/signup" element={<Layout><SignUpPage /></Layout>} />
        <Route path="/checkout" element={<CheckoutLayout step="shipping"><CheckoutShippingPage /></CheckoutLayout>} />
        <Route path="/order-confirmed" element={<Layout><OrderConfirmedPage /></Layout>} />
        <Route path="/account" element={<Layout><AccountLayout /></Layout>}>
          <Route index element={<AccountOverviewPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="addresses" element={<SavedAddressesPage />} />
          <Route path="profile" element={<AccountProfilePage />} />
        </Route>
      </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
