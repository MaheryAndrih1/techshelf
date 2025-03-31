import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        let response;
        try {
          // First try the standard endpoint
          response = await api.get('/orders/orders/');
        } catch (initialErr) {
          console.log("Initial endpoint failed, trying alternative:", initialErr);
          // If that fails, try a fallback endpoint
          response = await api.get('/orders/');
        }
        
        console.log("Orders data:", response.data);

        if (!response.data) {
          throw new Error('Received empty response from server');
        }
        
        if (response.data?.results) {
          setOrders(response.data.results);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          console.warn("Unexpected order data format:", response.data);
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(`Failed to fetch orders: ${err.message || 'Unknown error'}`);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
            <Link to="/products">
              <CustomButton type="primary">
                Browse Products
              </CustomButton>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

        {!Array.isArray(orders) || orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
            <Link to="/products" className="inline-block bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(order => (
                    <tr key={order.order_id}>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {order.order_id.substring(0, 8)}...
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        ${parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                          order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                          order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Link 
                          to={`/orders/${order.order_id}`}
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

export default OrderListPage;
