import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/seller/orders' } });
      return;
    }

    if (!isSeller) {
      navigate('/become-seller');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, isSeller, navigate, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Attempting to fetch seller orders...');
      let orderData = [];
      let success = false;
      
      // Try different possible endpoints
      const possibleOrderEndpoints = [
        '/orders/seller-orders/',
        '/orders/seller/',
        '/orders/?role=seller', 
        '/orders/my-store-orders/',
        '/orders/'
      ];
      
      if (statusFilter !== 'ALL') {
        possibleOrderEndpoints[0] = `/orders/seller-orders/?status=${statusFilter}`;
        possibleOrderEndpoints[1] = `/orders/seller/?status=${statusFilter}`;
        possibleOrderEndpoints[2] = `/orders/?role=seller&status=${statusFilter}`;
        possibleOrderEndpoints[3] = `/orders/my-store-orders/?status=${statusFilter}`;
        possibleOrderEndpoints[4] = `/orders/?status=${statusFilter}`;
      }
      
      for (const endpoint of possibleOrderEndpoints) {
        try {
          console.log(`Trying order endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          
          if (response.data) {
            if (Array.isArray(response.data)) {
              orderData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              orderData = response.data.results;
            }
            
            if (orderData.length > 0) {
              console.log(`Successfully fetched ${orderData.length} orders from ${endpoint}`);
              success = true;
              break;
            }
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed: ${err.message}`);
        }
      }
      
      if (!success) {
        console.warn('Failed to fetch orders from any endpoint');
      }
      
      setOrders(orderData);
    } catch (err) {
      console.error('Error in order fetching process:', err);
      setError(`Could not retrieve orders. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Customer Orders</h1>
          
          <div className="flex items-center">
            <span className="mr-2">Filter by:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No orders found</p>
            <Link to="/seller/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order.order_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.order_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.customer_name || 'Customer #' + order.user_id}
                      </td>
                      <td className="px-6 py-4">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                          order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                          order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/seller/orders/${order.order_id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerOrdersPage;
