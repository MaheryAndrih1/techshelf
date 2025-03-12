import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api, { getMediaUrl } from '../../utils/api';

const SellerDashboard = () => {
  const { isAuthenticated, isSeller, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/seller/dashboard' } });
      return;
    }

    if (!isSeller) {
      navigate('/become-seller');
      return;
    }

    const fetchSellerData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // First, get the seller's store
        let storeData = null;
        
        try {
          // Try to get store by user profile
          const profileResponse = await api.get('/users/profile/');
          if (profileResponse.data && profileResponse.data.id) {
            // Find the user's store
            const storesResponse = await api.get('/stores/');
            
            // Handle different response formats
            let storesArray = [];
            if (Array.isArray(storesResponse.data)) {
              storesArray = storesResponse.data;
            } else if (storesResponse.data && storesResponse.data.results && Array.isArray(storesResponse.data.results)) {
              storesArray = storesResponse.data.results;
            } else {
              console.error("Unexpected store response format:", storesResponse.data);
              storesArray = [];
            }
            
            const userStores = storesArray.filter(s => 
              s.user === profileResponse.data.username || s.user_id === profileResponse.data.id
            );
            
            if (userStores.length > 0) {
              storeData = userStores[0];
              console.log("Found store from user profile:", storeData);
            }
          }
        } catch (profileErr) {
          console.error("Error fetching from profile:", profileErr);
        }
        
        if (!storeData) {
          try {
            const storeResponse = await api.get('/users/profile/store/');
            storeData = storeResponse.data;
            console.log("Found store from direct endpoint:", storeData);
          } catch (storeErr) {
            console.error("Error fetching store directly:", storeErr);
          }
        }
        
        if (!storeData) {
          // No store found, redirect to create store
          setError('You need to create a store first');
          navigate('/seller/create-store');
          return;
        }
        
        setStore(storeData);
        
        // Fetch products for this specific store
        const productsResponse = await api.get(`/products/?store=${storeData.store_id}`);
        const fetchedProducts = productsResponse.data.results || productsResponse.data || [];
        setProducts(fetchedProducts);
        
        let fetchedOrders = [];
        try {
          const ordersResponse = await api.get('/orders/seller-orders/');
          fetchedOrders = ordersResponse.data?.results || ordersResponse.data || [];
          console.log("Seller orders:", fetchedOrders);
          setOrders(fetchedOrders);
        } catch (ordersErr) {
          console.error("Error fetching orders:", ordersErr);
          setOrders([]);
        }
        
        try {
          console.log("Attempting to fetch notifications for store:", storeData.store_id);
          
          const storeNotificationsResponse = await api.get(`/notifications/?store_id=${storeData.store_id}`);
          const storeNotifications = storeNotificationsResponse.data?.results || storeNotificationsResponse.data || [];
          console.log(`Found ${storeNotifications.length} store-specific notifications`);
          
          if (storeNotifications.length === 0) {
            console.log("No store notifications found. Fetching all user notifications.");
            const allNotificationsResponse = await api.get('/notifications/');
            const allNotifications = allNotificationsResponse.data?.results || allNotificationsResponse.data || [];
            console.log(`Found ${allNotifications.length} total user notifications`);
            
            const storeRelatedNotifications = allNotifications.filter(notification => 
              notification.message.includes(storeData.store_name) || 
              notification.message.includes(storeData.store_id) ||
              notification.message.toLowerCase().includes('order') ||
              notification.message.toLowerCase().includes('store')
            );
            
            setNotifications(storeRelatedNotifications.length > 0 ? 
              storeRelatedNotifications : allNotifications.slice(0, 5));
          } else {
            setNotifications(storeNotifications);
          }
        } catch (notifErr) {
          console.error("Error fetching notifications:", notifErr);
          
          try {
            const fallbackResponse = await api.get('/notifications/');
            setNotifications(fallbackResponse.data?.results || fallbackResponse.data || []);
            console.log("Used fallback to fetch all notifications");
          } catch (fallbackErr) {
            console.error("Fallback notification fetch failed:", fallbackErr);
            setNotifications([]);
          }
        }
        
        const paidOrders = fetchedOrders.filter(order => order.payment_status === 'PAID');
        const totalPaidSales = paidOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        
        setStats({
          totalProducts: fetchedProducts.length,
          totalOrders: fetchedOrders.length,
          totalSales: totalPaidSales
        });
        
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError('Failed to load seller dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerData();
  }, [isAuthenticated, isSeller, navigate, currentUser]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <div>
            <Link to="/seller/add-product" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Add New Product
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded">
            {error}
          </div>
        )}

        {store && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
                {store.theme?.logo_url ? (
                  <img 
                    src={getMediaUrl(store.theme.logo_url)} 
                    alt={store.store_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                    {store.store_name?.substring(0, 1).toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{store.store_name}</h2>
                <p className="text-gray-600">{store.subdomain_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">Products</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">Orders</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-purple-600">${stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold">Your Products</h3>
                <Link to="/seller/add-product" className="text-sm text-blue-600 hover:text-blue-800">
                  + Add New
                </Link>
              </div>
              
              {products.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">You haven't added any products yet</p>
                  <Link to="/seller/add-product" className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Add Your First Product
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map(product => (
                        <tr key={product.product_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gray-100">
                                {product.image ? (
                                  <img className="h-10 w-10 object-cover" src={product.image} alt={product.name} />
                                ) : (
                                  <div className="h-10 w-10 flex items-center justify-center text-gray-500 text-xs">No image</div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.stock > 10 ? 'bg-green-100 text-green-800' : 
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link to={`/products/${product.product_id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                              View
                            </Link>
                            <Link to={`/seller/edit-product/${product.product_id}`} className="text-blue-600 hover:text-blue-900">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Section */}
          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold">Recent Orders</h3>
                <Link to="/seller/orders" className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </Link>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No orders yet
                </div>
              ) : (
                <div className="p-4">
                  {orders.slice(0, 5).map(order => (
                    <Link 
                      key={order.order_id} 
                      to={`/seller/orders/${order.order_id}`}
                      className="block p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">#{order.order_id.substring(0, 8)}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                          order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                          order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} • ${parseFloat(order.total_amount).toFixed(2)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-semibold">Recent Notifications</h3>
                <Link to="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                  View All
                </Link>
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="p-4 divide-y divide-gray-100">
                  {notifications.slice(0, 5).map(notification => (
                    <div key={notification.notification_id} className="py-3">
                      <p className={notification.is_read ? "text-gray-600" : "text-gray-900 font-medium"}>
                        {notification.message}
                        {notification.link_url && (
                          <a 
                            href={notification.link_url}
                            className="ml-2 text-blue-600 hover:underline"
                          >
                            View details
                          </a>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerDashboard;
