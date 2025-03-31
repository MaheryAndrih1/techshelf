import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CustomButton from '../../components/CustomButton';

const CheckoutPage = () => {
  const { cart, clearCart, isGuestCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    full_name: currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    card_number: '',
    card_holder: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    // If cart is empty, redirect to cart page
    if (!cart || !cart.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Fetch user's shipping info if available
    const fetchShippingInfo = async () => {
      try {
        const response = await api.get('/users/profile/');
        if (response.data.shipping_info) {
          setShippingInfo(prev => ({
            ...prev,
            ...response.data.shipping_info
          }));
        }
      } catch (err) {
        console.error('Failed to fetch shipping info:', err);
      }
    };
    
    fetchShippingInfo();
  }, [isAuthenticated, cart, navigate]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate shipping info
      const requiredFields = ['full_name', 'address', 'city', 'state', 'postal_code', 'country'];
      const missingFields = requiredFields.filter(field => !shippingInfo[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in the following fields: ${missingFields.join(', ')}`);
      }
      
      // Process the checkout - use the orders/checkout/ endpoint instead of checkout/
      const response = await api.post('/orders/checkout/', {
        shipping_info: shippingInfo
      });
      
      if (response.data && response.data.order_id) {
        setSuccess(true);
        setOrderId(response.data.order_id);
        clearCart();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (success && orderId) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#33353a] mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been placed successfully.</p>
            <p className="text-gray-800 mb-8">Order ID: <span className="font-medium text-[#c5630c]">{orderId}</span></p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
              <CustomButton onClick={() => navigate('/orders')} type="primary">
                View Your Orders
              </CustomButton>
              <CustomButton onClick={() => navigate('/products')} type="outline">
                Continue Shopping
              </CustomButton>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="loader mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#33353a]">Checkout</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-[#33353a]">Shipping Information</h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="full_name">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={shippingInfo.full_name}
                      onChange={handleShippingChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleShippingChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="postal_code">Postal Code</label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={shippingInfo.postal_code}
                      onChange={handleShippingChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="country">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
                
                <h2 className="text-xl font-bold mb-4 text-[#33353a]">Payment Method</h2>
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <p className="text-gray-700">This is a demo app. No actual payment will be processed.</p>
                  <p className="text-gray-700">You can enter any test data in the payment fields.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="card_number">Card Number</label>
                    <input
                      type="text"
                      id="card_number"
                      name="card_number"
                      value={paymentInfo.card_number}
                      onChange={handlePaymentChange}
                      placeholder="4111 1111 1111 1111"
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="card_holder">Cardholder Name</label>
                    <input
                      type="text"
                      id="card_holder"
                      name="card_holder"
                      value={paymentInfo.card_holder}
                      onChange={handlePaymentChange}
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="expiry">Expiry Date</label>
                    <input
                      type="text"
                      id="expiry"
                      name="expiry"
                      value={paymentInfo.expiry}
                      onChange={handlePaymentChange}
                      placeholder="MM/YY"
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="cvv">CVV</label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={paymentInfo.cvv}
                      onChange={handlePaymentChange}
                      placeholder="123"
                      className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    />
                  </div>
                </div>
                
                <CustomButton
                  type="submit"
                  size="large"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </CustomButton>
              </form>
            </div>
          </div>
          
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-[#33353a]">Order Summary</h2>
              
              <div className="border-b pb-4 mb-4">
                {cart?.items?.map(item => (
                  <div key={item.id || item.product_id} className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">
                        {item.quantity} x {item.product?.name || item.product_name || 'Product'}
                      </span>
                    </div>
                    <span className="text-gray-700">
                      ${parseFloat(item.product?.price || item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-800">${cart?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                
                {cart?.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium text-gray-800">${cart?.shipping_cost?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-800">${cart?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-[#c5630c] text-xl">${cart?.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
