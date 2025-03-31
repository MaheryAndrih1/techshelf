import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProductListPage from './pages/products/ProductListPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import OrderListPage from './pages/orders/OrderListPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import StoreListPage from './pages/stores/StoreListPage';
import StoreDetailPage from './pages/stores/StoreDetailPage';
import BecomeSellerPage from './pages/seller/BecomeSellerPage';
import CreateStorePage from './pages/seller/CreateStorePage';
import SellerDashboard from './pages/seller/SellerDashboard';
import AddProductPage from './pages/seller/AddProductPage';
import SellerOrderDetailPage from './pages/seller/SellerOrderDetailPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import EditProductPage from './pages/seller/EditProductPage';
import LikedProductsPage from './pages/user/LikedProductsPage';

// Auth route wrapper
const ProtectedRoute = ({ element, requiresSeller = false }) => {
  const { isAuthenticated, isSeller, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiresSeller && !isSeller) {
    return <Navigate to="/become-seller" replace />;
  }
  
  return element;
};


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/stores" element={<StoreListPage />} />
      <Route path="/stores/:subdomain" element={<StoreDetailPage />} />
      
      {/* Cart */}
      <Route path="/cart" element={<CartPage />} />
      
      {/* Protected Routes */}
      <Route path="/checkout" element={<ProtectedRoute element={<CheckoutPage />} />} />
      <Route path="/orders" element={<ProtectedRoute element={<OrderListPage />} />} />
      <Route path="/orders/:orderId" element={<ProtectedRoute element={<OrderDetailPage />} />} />
      <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
      <Route path="/notifications" element={<ProtectedRoute element={<NotificationsPage />} />} />
      <Route path="/become-seller" element={<ProtectedRoute element={<BecomeSellerPage />} />} />
      
      {/* Seller Routes */}
      <Route 
        path="/seller/create-store" 
        element={<ProtectedRoute element={<CreateStorePage />} requiresSeller={true} />} 
      />
      <Route 
        path="/seller/dashboard" 
        element={<ProtectedRoute element={<SellerDashboard />} requiresSeller={true} />} 
      />
      <Route 
        path="/seller/add-product" 
        element={<ProtectedRoute element={<AddProductPage />} requiresSeller={true} />} 
      />
      <Route 
        path="/seller/edit-product/:productId" 
        element={<ProtectedRoute element={<EditProductPage />} requiresSeller={true} />} 
      />
      <Route 
        path="/seller/orders" 
        element={<ProtectedRoute element={<SellerOrdersPage />} requiresSeller={true} />} 
      />
      <Route 
        path="/seller/orders/:orderId" 
        element={<ProtectedRoute element={<SellerOrderDetailPage />} requiresSeller={true} />} 
      />
      <Route path="/liked-products" element={<LikedProductsPage />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
