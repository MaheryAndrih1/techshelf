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
      let orderData = null;
      const possibleEndpoints = [
        `/orders/seller-orders/${orderId}/`,
        `/orders/seller/${orderId}/`,
        `/orders/${orderId}/`,
        `/orders/detail/${orderId}/`
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying to fetch order details from: ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            orderData = response.data;
            console.log(`Successfully fetched order from ${endpoint}:`, orderData);
            break;
          }
        } catch (endpointErr) {
          console.log(`Endpoint ${endpoint} failed: ${endpointErr.message}`);
        }
      }
      
      if (!orderData) {
        throw new Error('Could not retrieve order details from any endpoint');
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(`Failed to load order details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    setStatusUpdating(true);
    setUpdateSuccess('');
    setError(null);
    
    try {
      console.log(`Attempting to update order ${orderId} status to: ${newStatus}`);
      let response = null;
      
      // Try multiple possible endpoints for updating order status
      const possibleEndpoints = [
        `/orders/seller-orders/${orderId}/update-status/`,
        `/orders/seller/${orderId}/update-status/`,
        `/orders/${orderId}/status/`,
        `/orders/update-status/${orderId}/`
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await api.post(endpoint, { status: newStatus });
          
          if (response.data) {
            console.log('Status update successful:', response.data);
            break;
          }
        } catch (endpointErr) {
          console.log(`Endpoint ${endpoint} failed: ${endpointErr.message}`);
        }
      }
      
      if (!response || !response.data) {
        throw new Error('Failed to update status through any available endpoint');
      }
      
      setOrder(response.data);
      setUpdateSuccess(`Order status updated to ${newStatus}`);
      
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status: ' + err.message);
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Order not found"}
          </div>
          <div className="mt-4">
            <Link to="/seller/orders" className="text-blue-600 hover:underline">
              &larr; Back to Orders
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/seller/orders" className="text-blue-600 hover:underline">
            &larr; Back to Orders
          </Link>
          <h1 className="text-2xl font-bold mt-2">Order Details: #{order.order_id.substring(0, 8)}</h1>
        </div>
        
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {updateSuccess}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-lg font-semibold">Order Information</h2>
                <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center">
                <span className="mr-4">Status:</span>
                <select
                  value={order.order_status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={statusUpdating}
                  className="border rounded px-3 py-2"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                {statusUpdating && (
                  <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-2">Customer Information</h3>
                <p className="text-gray-700">Customer: {order.customer_name || 'N/A'}</p>
                <p className="text-gray-700">Email: {order.customer_email || 'N/A'}</p>
                <p className="text-gray-700">Phone: {order.customer_phone || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Shipping Address</h3>
                {order.shipping_info ? (
                  <address className="not-italic text-gray-700">
                    {order.shipping_info.shipping_address}<br />
                    {order.shipping_info.city}, {order.shipping_info.postal_code}<br />
                    {order.shipping_info.country}
                  </address>
                ) : (
                  <p className="text-gray-500">No shipping information available</p>
                )}
              </div>
            </div>
            
            <h3 className="font-medium mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3">
                        {item.product_name || `Product #${item.product_id}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        ${parseFloat(item.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Subtotal:</td>
                    <td className="px-4 py-3 text-right">
                      ${(parseFloat(order.total_amount) - parseFloat(order.tax_amount || 0) - parseFloat(order.shipping_cost || 0)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Shipping:</td>
                    <td className="px-4 py-3 text-right">
                      ${parseFloat(order.shipping_cost || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Tax:</td>
                    <td className="px-4 py-3 text-right">
                      ${parseFloat(order.tax_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium">Total:</td>
                    <td className="px-4 py-3 text-right font-bold">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerOrderDetailPage;
