import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Layout from '../../components/layout/Layout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error, isAuthenticated } = useAuth();
  const { mergeCartsAfterLogin } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getRedirectPath = () => {
    if (location.state?.from) {
      return location.state.from;
    }
    
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (redirectParam) {
      return decodeURIComponent(redirectParam);
    }
    
    const storedPath = sessionStorage.getItem('redirectAfterLogin');
    if (storedPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      return storedPath;
    }
    
    return '/';
  };
  
  const redirectPath = getRedirectPath();

  useEffect(() => {
    // If already authenticated, redirect to the intended destination
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    try {
      await login(email, password);
      
      await mergeCartsAfterLogin();
  
      const redirectToCart = sessionStorage.getItem('redirectToCartAfterAuth');
      if (redirectToCart) {
        sessionStorage.removeItem('redirectToCartAfterAuth');
        navigate('/cart');
      } else {
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Login to Your Account</h1>
        
        {redirectPath !== '/' && redirectPath !== '/login' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            Please log in to continue to {redirectPath.replace(/^\//, '')}
          </div>
        )}
        
        {(error || formError) && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formError || error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition duration-200"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
