import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CheckoutPage = () => {
  const { cart, loading, error, checkout } = useCart();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    shipping_address: '',
    city: '',
    country: '',
    postal_code: '',
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    name_on_card: ''
  });
  
  const [saveCard, setSaveCard] = useState(false);
  const [useSavedCard, setUseSavedCard] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (!loading && (!cart || !cart.items || cart.items.length === 0)) {
      navigate('/cart');
    }
    
    if (currentUser) {
      if (currentUser.shipping_address) {
        setShippingInfo({
          shipping_address: currentUser.shipping_address || '',
          city: currentUser.city || '',
          country: currentUser.country || '',
          postal_code: currentUser.postal_code || '',
        });
      }
    }
  }, [isAuthenticated, loading, cart, navigate, currentUser]);

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
    setFormError('');
    setFormSuccess('');
    setProcessing(true);
    
    try {
      const { shipping_address, city, country, postal_code } = shippingInfo;
      if (!shipping_address || !city || !country || !postal_code) {
        setFormError('Please fill in all shipping information');
        setProcessing(false);
        return;
      }
      
      if (!useSavedCard) {
        const { card_number, expiry_date, cvv, name_on_card } = paymentInfo;
        if (!card_number || !expiry_date || !cvv || !name_on_card) {
          setFormError('Please fill in all payment information');
          setProcessing(false);
          return;
        }
      }
      
      const checkoutData = {
        ...shippingInfo,
        payment_info: useSavedCard ? undefined : paymentInfo,
        use_saved_card: useSavedCard,
        save_card: saveCard
      };
      
      const order = await checkout(checkoutData);
      
      setFormSuccess('Order placed successfully!');
      setTimeout(() => {
        navigate(`/orders/${order.order_id}`);
      }, 1500);
      
    } catch (err) {
      setFormError(err.message || 'An error occurred during checkout');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <div className="flex justify-center items-center h-64">
            <div className="loader">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formError}
          </div>
        )}
        
        {formSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {formSuccess}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 order-2 lg:order-1">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">Order Summary</h2>
              
              {cart && cart.items && cart.items.map(item => (
                <div key={item.product_id} className="flex justify-between py-2 border-b">
                  <span className="flex-grow">
                    {item.product?.name || 'Product'} <span className="text-gray-500">x {item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    ${((parseFloat(item.product?.price || 0)) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>${cart?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                
                {cart?.discount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>Discount:</span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between mb-2">
                  <span>Shipping:</span>
                  <span>${cart?.shipping_cost?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between mb-4">
                  <span>Tax:</span>
                  <span>${cart?.tax?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${cart?.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
              <div className="mb-6 space-y-4">
                <div>
                  <label htmlFor="shipping_address" className="block mb-1 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="shipping_address"
                    name="shipping_address"
                    value={shippingInfo.shipping_address}
                    onChange={handleShippingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block mb-1 text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postal_code" className="block mb-1 text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={shippingInfo.postal_code}
                      onChange={handleShippingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="country" className="block mb-1 text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={shippingInfo.country}
                    onChange={handleShippingChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <h2 className="text-lg font-semibold mb-4 border-t pt-4">Payment Information</h2>
              
              {currentUser?.has_billing_info && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useSavedCard}
                      onChange={(e) => setUseSavedCard(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Use saved card ending in {currentUser?.billing_info?.last4 || '****'}</span>
                  </label>
                </div>
              )}
              
              {!useSavedCard && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name_on_card" className="block mb-1 text-sm font-medium text-gray-700">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      id="name_on_card"
                      name="name_on_card"
                      value={paymentInfo.name_on_card}
                      onChange={handlePaymentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="card_number" className="block mb-1 text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      id="card_number"
                      name="card_number"
                      value={paymentInfo.card_number}
                      onChange={handlePaymentChange}
                      placeholder="**** **** **** ****"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry_date" className="block mb-1 text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiry_date"
                        name="expiry_date"
                        value={paymentInfo.expiry_date}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block mb-1 text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentInfo.cvv}
                        onChange={handlePaymentChange}
                        placeholder="***"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Save this card for future purchases</span>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {processing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
