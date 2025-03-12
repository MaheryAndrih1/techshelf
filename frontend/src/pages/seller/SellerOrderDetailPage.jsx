import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SellerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/seller/orders/${orderId}` } });
      return;
    }

    if (!isSeller) {
      navigate('/become-seller');
      return;
    }

    fetchOrderDetails();
  }, [isAuthenticated, isSeller, orderId, navigate]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      console.log(`Fetching order details from: /orders/seller-orders/${orderId}/`);
      const response = await api.get(`/orders/seller-orders/${orderId}/`);
      
      if (response.data) {
        console.log("Order details:", response.data);
        setOrder(response.data);
      } else {
        throw new Error("Invalid order data received");
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
      setError(`Could not retrieve order details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    setStatusUpdating(true);
    setUpdateSuccess('');
    try {
      const response = await api.put(`/orders/seller-orders/${orderId}/update-status/`, {
        status: newStatus
      });
      
      if (response.data) {
        setOrder({...order, order_status: newStatus});
        setUpdateSuccess(`Order status updated to ${newStatus}`);
        
        setTimeout(() => setUpdateSuccess(''), 3000);
      }
    } catch (err) {
      setError(`Failed to update order status: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
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

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Order not found"}
          </div>
          <Link to="/seller/orders" className="text-blue-600 hover:underline">
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
          <div>
            <h1 className="text-2xl font-bold">Order #{order.order_id.substring(0, 8)}</h1>
            <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          
          <Link to="/seller/orders" className="text-blue-600 hover:underline">
            &larr; Back to Orders
          </Link>
        </div>
        
        {updateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {updateSuccess}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Order Status Section */}
        <div className="bg-white rounded shadow-md mb-6">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-lg">Order Status</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                  order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                  order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.order_status}
                </span>
                
                <div className="mt-2 text-gray-600">
                  Payment Status: <span className={order.payment_status === 'PAID' ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
              
              {order.order_status !== 'DELIVERED' && order.order_status !== 'CANCELLED' && (
                <div className="flex space-x-2">
                  {order.order_status === 'CREATED' && (
                    <button
                      onClick={() => updateOrderStatus('PROCESSING')}
                      disabled={statusUpdating}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {statusUpdating ? 'Updating...' : 'Start Processing'}
                    </button>
                  )}
                  
                  {order.order_status === 'PROCESSING' && (
                    <button
                      onClick={() => updateOrderStatus('SHIPPED')}
                      disabled={statusUpdating}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {statusUpdating ? 'Updating...' : 'Mark as Shipped'}
                    </button>
                  )}
                  
                  {order.order_status === 'SHIPPED' && (
                    <button
                      onClick={() => updateOrderStatus('DELIVERED')}
                      disabled={statusUpdating}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
                    >
                      {statusUpdating ? 'Updating...' : 'Mark as Delivered'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded shadow-md mb-6">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-lg">Customer Information</h2>
          </div>
          <div className="p-6">
            <p className="font-medium">{order.username || order.customer_name || 'Anonymous Customer'}</p>
            
            {order.shipping_info && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700">Shipping Address:</h3>
                <p className="mt-1 text-gray-600">
                  {order.shipping_info.shipping_address}<br />
                  {order.shipping_info.city}, {order.shipping_info.country} {order.shipping_info.postal_code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded shadow-md mb-6">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-lg">Order Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.product_name || `Product ID: ${item.product_id}`}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-900">${parseFloat(item.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium">Subtotal:</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${(parseFloat(order.total_amount) - parseFloat(order.shipping_cost)).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-medium">Shipping:</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${parseFloat(order.shipping_cost).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold">Total:</td>
                  <td className="px-6 py-4 text-right text-lg font-bold">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerOrderDetailPage;
