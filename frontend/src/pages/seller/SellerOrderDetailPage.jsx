import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SellerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (!isAuthenticated || !isSeller) {
      navigate('/login', { state: { from: `/seller/orders/${orderId}` } });
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/seller-orders/${orderId}/`);
        setOrder(response.data);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, isAuthenticated, isSeller, navigate]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    setStatusMessage('');
    
    try {
      const response = await api.post(`/orders/seller-orders/${orderId}/update-status/`, {
        status: newStatus
      });
      
      setOrder(response.data);
      setStatusMessage('Order status updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to update order status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader">Loading...</div>
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
          <Link to="/seller/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
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
            <Link to="/seller/dashboard" className="text-blue-600 hover:underline mb-2 inline-block">
              &larr; Back to Dashboard
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
          </div>
        </div>
        
        {statusMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {statusMessage}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Customer Information</h2>
              <p className="text-gray-700">{order.customer_name || 'Customer #' + order.user}</p>
              <p className="text-gray-700">{order.customer_email || 'Email not available'}</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <h2 className="text-lg font-semibold mb-2">Update Order Status</h2>
              <div className="flex space-x-2">
                <select 
                  className="border rounded px-3 py-2"
                  value={order.order_status}
                  disabled={updating}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                >
                  {statusOptions.map(option => (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={option.value === 'CANCELLED' && ['DELIVERED', 'SHIPPED'].includes(order.order_status)}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                {updating && <div className="loader"></div>}
              </div>
            </div>
          </div>
          
          <h2 className="text-lg font-semibold mb-4 border-t pt-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-center">Price</th>
                  <th className="px-4 py-2 text-center">Quantity</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items?.map(item => (
                  <tr key={item.id || item.product_id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <Link to={`/products/${item.product_id}`}>
                          {item.product_name || item.product?.name || 'Product'}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">${parseFloat(item.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">{item.quantity}</td>
                    <td className="px-4 py-4 text-right">${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-medium">Subtotal:</td>
                  <td className="px-4 py-3 text-right">${(parseFloat(order.total_amount || 0) - parseFloat(order.tax_amount || 0) - parseFloat(order.shipping_cost || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-medium">Shipping:</td>
                  <td className="px-4 py-3 text-right">${parseFloat(order.shipping_cost || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-medium">Tax:</td>
                  <td className="px-4 py-3 text-right">${parseFloat(order.tax_amount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold">${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
            {order.shipping_info ? (
              <address className="not-italic">
                {order.shipping_info.shipping_address}<br />
                {order.shipping_info.city}, {order.shipping_info.postal_code}<br />
                {order.shipping_info.country}
              </address>
            ) : (
              <p className="text-gray-600">Shipping information not available</p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className={`${
                order.payment_status === 'PAID' ? 'text-green-600' :
                order.payment_status === 'REFUNDED' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {order.payment_status}
              </span>
            </p>
            <p>
              <span className="font-medium">Payment Method:</span>{' '}
              <span className="text-gray-600">{order.payment_method || 'Not specified'}</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerOrderDetailPage;
