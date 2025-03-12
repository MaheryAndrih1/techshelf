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
      
      const endpoint = statusFilter !== 'ALL' 
        ? `/orders/seller-orders/?status=${statusFilter}`
        : '/orders/seller-orders/';
      
      console.log(`Using seller orders endpoint: ${endpoint}`);
      
      const response = await api.get(endpoint);
      
      if (response.data) {
        const orderData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
          
        if (orderData.length > 0) {
          console.log('Sample order data structure:', JSON.stringify(orderData[0], null, 2));
        }
        
        console.log(`Successfully fetched ${orderData.length} orders`);
        setOrders(orderData);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
      setError(`Could not retrieve orders: ${err.message}`);
      setOrders([]);
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
                        {(() => {
                          // Debug what fields are available
                          const hasCustomerName = !!order.customer_name;
                          const hasUserObj = typeof order.user === 'object' && !!order.user;
                          const hasUserString = typeof order.user === 'string';
                          const hasUserId = !!order.user_id;
                          const hasUsername = !!order.username;
                          
                          console.log(`Order ${order.order_id.substring(0,8)} customer data:`, 
                            {hasCustomerName, hasUserObj, hasUserString, hasUserId, hasUsername, 
                             user: order.user, username: order.username});
                          
                          if (order.customer_name) return order.customer_name;
                          if (order.username) return order.username;
                          if (typeof order.user === 'object' && order.user?.username) return order.user.username;
                          if (typeof order.user === 'string') return order.user;
                          if (order.user_id) return `Customer #${order.user_id}`;
                          
                          for (const [key, value] of Object.entries(order)) {
                            if ((key.includes('user') || key.includes('customer')) && 
                                typeof value === 'string' && value !== '') {
                              return value;
                            }
                          }
                          
                          return 'Anonymous Customer';
                        })()}
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
