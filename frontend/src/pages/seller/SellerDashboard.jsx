import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const SellerDashboard = () => {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Create a separate function for fetching orders that can be reused
  const fetchOrders = useCallback(async () => {
    try {
      // Use the correct endpoint for seller orders
      const ordersResponse = await api.get('/orders/seller-orders/');
      console.log("Orders data retrieved:", ordersResponse.data);
      
      const ordersData = ordersResponse.data?.results || ordersResponse.data || [];
      return ordersData;
    } catch (err) {
      console.error("Failed to fetch seller orders:", err);
      return [];
    }
  }, []);

  const fetchSellerData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch store data
      const storeResponse = await api.get('/users/profile/store/');
      setStore(storeResponse.data);
      
      if (!storeResponse.data) {
        navigate('/seller/create-store');
        return;
      }
      
      // Fetch products
      const productsResponse = await api.get(`/products/?store=${storeResponse.data.store_id}`);
      const productsData = productsResponse.data.results || productsResponse.data;
      setProducts(productsData);
      
      // Fetch orders using the separate function
      const ordersData = await fetchOrders();
      setOrders(ordersData);
      
      // Calculate stats
      let totalSales = 0;
      let pendingOrders = 0;
      
      ordersData.forEach(order => {
        totalSales += parseFloat(order.total_amount || 0);
        if (order.order_status === 'PROCESSING' || order.order_status === 'CREATED' || order.order_status === 'PENDING') {
          pendingOrders++;
        }
      });
      
      setStats({
        totalSales: totalSales,
        totalOrders: ordersData.length,
        totalProducts: productsData.length,
        pendingOrders: pendingOrders
      });
      
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchOrders]);

  // This effect runs when the component mounts
  useEffect(() => {
    fetchSellerData();
    
    // Set up a refresh interval to check for new orders
    const refreshInterval = setInterval(() => {
      console.log("Refreshing dashboard data");
      fetchSellerData();
    }, 90000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchSellerData]);

  const handleRefresh = () => {
    fetchSellerData();
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#33353a]">Seller Dashboard</h1>
        </div>
        
        {/* Store Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-[#c5630c]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#33353a] mb-2">{store?.store_name}</h2>
              <p className="text-gray-600 mb-4">Subdomain: {store?.subdomain_name}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-4">
                  <svg className="w-4 h-4 inline mr-1 text-[#a47f6f]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Created: {new Date(store?.created_at).toLocaleDateString()}
                </span>
                <span>
                  <svg className="w-4 h-4 inline mr-1 text-[#a47f6f]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Rating: {store?.average_rating ? store.average_rating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link to={`/stores/${store?.subdomain_name}`}>
                <CustomButton type="outline">
                  View Store
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#c5630c]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-[#c5630c] mr-4">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Sales</p>
                <p className="text-2xl font-semibold text-[#33353a]">${stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#a47f6f]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-[#f8f1ee] text-[#a47f6f] mr-4">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-2xl font-semibold text-[#33353a]">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#33353a]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100 text-[#33353a] mr-4">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="text-2xl font-semibold text-[#33353a]">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#c5630c]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-[#c5630c] mr-4">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Orders</p>
                <p className="text-2xl font-semibold text-[#33353a]">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-[#33353a]">Recent Orders</h2>
              {orders.length > 0 && (
                <span className="ml-2 text-xs bg-[#c5630c] text-white px-2 py-1 rounded-full">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Link to="/seller/orders">
              <CustomButton type="outline" size="small">
                View All Orders
              </CustomButton>
            </Link>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#c5630c]">
                        {order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.customer_name || order.username || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                            order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            order.order_status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                            order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {order.order_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ${parseFloat(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/seller/orders/${order.order_id}`}>
                          <CustomButton type="outline" size="small">
                            Details
                          </CustomButton>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Products & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#33353a]">Your Products</h2>
              <Link to="/seller/add-product">
                <CustomButton type="primary" size="small">
                  Add New Product
                </CustomButton>
              </Link>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No products yet</p>
                <Link to="/seller/add-product">
                  <CustomButton type="primary" size="small" className="mt-4">
                    Add your first product
                  </CustomButton>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.product_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="h-10 w-10 object-cover" />
                              ) : (
                                <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          ${parseFloat(product.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${product.stock > 10 ? 'bg-green-100 text-green-800' : 
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {product.stock} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/seller/edit-product/${product.product_id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <CustomButton type="outline" size="small">
                              Edit
                            </CustomButton>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                 
                {products.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/seller/products">
                      <CustomButton type="outline" size="small">
                        View All Products
                      </CustomButton>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#33353a] mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Link to="/seller/add-product" className="block">
                <CustomButton type="primary" fullWidth>
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add New Product
                </CustomButton>
              </Link>
              
              <Link to="/seller/orders" className="block">
                <CustomButton type="secondary" fullWidth>
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Manage Orders
                </CustomButton>
              </Link>
              
              <Link to={`/stores/${store?.subdomain_name}`} className="block">
                <CustomButton type="dark" fullWidth>
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Visit Your Store
                </CustomButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerDashboard;
