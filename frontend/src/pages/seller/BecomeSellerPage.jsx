import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

const BecomeSellerPage = () => {
  const { isAuthenticated, upgradeToSeller, isSeller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/become-seller' } });
    return null;
  }

  if (isSeller) {
    navigate('/seller/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await upgradeToSeller();
      setSuccess('Your account has been upgraded to seller!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/seller/create-store');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to upgrade account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Become a Seller</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Why Sell on TechShelf?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Reach More Customers</h3>
                <p className="text-gray-600 text-sm">Access our large customer base looking for tech products</p>
              </div>
              
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Boost Your Income</h3>
                <p className="text-gray-600 text-sm">Start earning by selling your products online</p>
              </div>
              
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Easy to Use</h3>
                <p className="text-gray-600 text-sm">Our platform makes selling simple and straightforward</p>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-700">
              <li>Upgrade your account to seller status</li>
              <li>Create your store with a custom name and subdomain</li>
              <li>Add products to your store inventory</li>
              <li>Start selling and earning!</li>
            </ol>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="flex items-center mb-6">
                <input type="checkbox" id="terms" className="mr-2" required />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> for sellers on TechShelf
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Processing...' : 'Become a Seller'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BecomeSellerPage;
