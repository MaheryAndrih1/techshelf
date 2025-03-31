import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect parameter in URL
  const redirectPath = new URLSearchParams(location.search).get('redirect');
  const from = location.state?.from || redirectPath || '/';

  useEffect(() => {
    // If user is already logged in, redirect to home or previous page
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      // If successful, the useEffect will redirect
    } catch (err) {
      console.error('Login failed:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#33353a]">Sign In</h1>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-[#33353a] text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className={`w-full p-3 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#c5630c]`}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {formErrors.email && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.email}</p>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-[#33353a] text-sm font-medium mb-2">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-[#c5630c] hover:text-[#a47f6f]">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                className={`w-full p-3 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#c5630c]`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {formErrors.password && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.password}</p>
              )}
            </div>
            
            <CustomButton
              type="submit"
              disabled={isSubmitting}
              fullWidth
              size="large"
            >
              {isSubmitting ? 
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span> : 
                'Sign In'
              }
            </CustomButton>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#33353a]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#c5630c] hover:text-[#a47f6f] font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
