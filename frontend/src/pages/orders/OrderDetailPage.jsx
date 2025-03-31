import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [productDetails, setProductDetails] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${orderId}` } });
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/orders/${orderId}/`);
        console.log('Order data:', response.data);
        setOrder(response.data);


        if (response.data?.items && response.data.items.length > 0) {
          const productDetailsObj = {};
          await Promise.all(response.data.items.map(async (item) => {
            try {
              const prodResponse = await api.get(`/products/${item.product_id}/`);
              productDetailsObj[item.product_id] = prodResponse.data;
            } catch (err) {
              console.warn(`Couldn't fetch details for product ${item.product_id}:`, err);

              const nameParts = item.product_id.split('_');
              const productName = nameParts.length > 1 
                ? nameParts[1].split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')
                : 'Product';
              
              productDetailsObj[item.product_id] = {
                name: productName,
                image: null,
                price: item.price
              };
            }
          }));
          setProductDetails(productDetailsObj);
        }
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, navigate]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await api.post(`/orders/orders/${orderId}/cancel/`);
      setOrder(response.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // Order item component
  const OrderItem = ({ item }) => {
    const product = productDetails[item.product_id] || {};
    const productName = product.name || formatProductName(item.product_id);
    const productPrice = parseFloat(item.price || 0);
    const productImage = product.image || null;

    function formatProductName(productId) {
      if (!productId) return 'Unknown Product';
      if (!productId.includes('_')) return productId;
      
      const namePart = productId.split('_')[1] || '';
      return namePart.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    return (
      <div className="flex py-4 border-b">
        <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-500">
                    ${productName.charAt(0).toUpperCase()}
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-500">
              {productName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between">
            <Link 
              to={`/products/${item.product_id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {productName}
            </Link>
            <span className="font-medium">${productPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 mt-1">
            <span>Quantity: {item.quantity || 1}</span>
            <span>${(productPrice * (item.quantity || 1)).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link to="/orders">
            <SimpleButton type="outline">
              Back to Orders
            </SimpleButton>
          </Link>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Order not found"}
        </div>
        <div className="mt-4">
          <Link to="/orders" className="text-blue-600 hover:underline">
            &larr; Back to Orders
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#33353a]">Order Details</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/orders" className="text-blue-600 hover:underline mb-2 inline-block">
              &larr; Back to Orders
            </Link>
            <h1 className="text-2xl font-bold">Order #{order.order_id.substring(0, 8)}...</h1>
            <p className="text-gray-600">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
              order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
              order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {order.order_status}
            </span>
            
            {(order.order_status === 'PROCESSING' || order.order_status === 'PENDING') && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:bg-red-300"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Order details */}
          <div className="lg:w-2/3">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">Order Items</h2>
              
              {order.items.map(item => (
                <OrderItem key={item.id || item.product_id || Math.random().toString(36).substring(7)} item={item} />
              ))}
            </div>
          </div>
          
          {/* Order summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${(order.total_amount - order.tax_amount - order.shipping_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${parseFloat(order.shipping_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${parseFloat(order.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
              
              <h3 className="font-medium mb-2 border-t pt-4">Shipping Address</h3>
              {order.shipping_info ? (
                <address className="not-italic text-gray-600">
                  {order.shipping_info.shipping_address}<br />
                  {order.shipping_info.city}, {order.shipping_info.postal_code}<br />
                  {order.shipping_info.country}
                </address>
              ) : (
                <p className="text-gray-600">Shipping information not available</p>
              )}
              
              <h3 className="font-medium mb-2 border-t pt-4 mt-4">Payment Information</h3>
              <p className="text-gray-600">
                {order.payment_status === 'PAID' ? (
                  <span className="text-green-600">Payment completed</span>
                ) : order.payment_status === 'REFUNDED' ? (
                  <span className="text-blue-600">Payment refunded</span>
                ) : (
                  <span className="text-yellow-600">Payment {order.payment_status.toLowerCase()}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
