import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductCreatePage } from '@/pages/ProductCreatePage';
import { ProductEditPage } from '@/pages/ProductEditPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { CouponsPage } from '@/pages/CouponsPage';
import { CampusesPage } from '@/pages/CampusesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductCreatePage />} />
        <Route path="products/:id" element={<ProductEditPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="campuses" element={<CampusesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
