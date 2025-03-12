import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SellerDashboard = () => {
  const { isAuthenticated, isSeller, currentUser } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      try {
        // Directly check if we can fetch stores by owner/user ID
        // This is the most common API pattern
        console.log('Current user:', currentUser);
        
        if (!currentUser?.id) {
          throw new Error('User ID not available');
        }
        
        // Try to get store using user ID
        const storeResponse = await api.get(`/stores/?user=${currentUser.id}`);
        console.log('Store response:', storeResponse.data);
        
        // Handle different response formats (array or object with results)
        let storeData = null;
        
        if (storeResponse.data && Array.isArray(storeResponse.data) && storeResponse.data.length > 0) {
          storeData = storeResponse.data[0];
        } else if (storeResponse.data?.results && Array.isArray(storeResponse.data.results) && storeResponse.data.results.length > 0) {
          storeData = storeResponse.data.results[0];
        } else if (storeResponse.data && storeResponse.data.store_id) {
          storeData = storeResponse.data;
        }
        
        if (storeData) {
          console.log('Found store:', storeData);
          setStore(storeData);
          
          // If store exists, get products and orders
          try {
            const productsResponse = await api.get(`/products/?store=${storeData.store_id}`);
            setProducts(productsResponse.data.results || productsResponse.data || []);
          } catch (productErr) {
            console.error('Error fetching products:', productErr);
            setProducts([]);
          }
          
          // Try multiple possible endpoints for seller orders
          try {
            console.log('Attempting to fetch seller orders...');
            let orderData = [];
            
            // Try different possible endpoints
            const possibleOrderEndpoints = [
              '/orders/seller-orders/',
              '/orders/seller/',
              `/orders/?store=${storeData.store_id}`,
              '/orders/'
            ];
            
            for (const endpoint of possibleOrderEndpoints) {
              try {
                console.log(`Trying endpoint: ${endpoint}`);
                const ordersResponse = await api.get(endpoint);
                
                if (ordersResponse.data) {
                  if (Array.isArray(ordersResponse.data)) {
                    orderData = ordersResponse.data;
                  } else if (ordersResponse.data.results && Array.isArray(ordersResponse.data.results)) {
                    orderData = ordersResponse.data.results;
                  }
                  
                  if (orderData.length > 0) {
                    console.log(`Successfully fetched ${orderData.length} orders from ${endpoint}`);
                    break;
                  }
                }
              } catch (err) {
                console.log(`Endpoint ${endpoint} failed: ${err.message}`);
              }
            }
            
            setOrders(orderData);
          } catch (orderErr) {
            console.error('Error fetching orders:', orderErr);
            setOrders([]);
          }
        } else {
          console.log('No store found for this user');
          setError('No store found. Please create a store to continue.');
        }
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError('Failed to load seller data. Please create a store to get started.');
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
        <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            {!store && (
              <div className="mt-2">
                <p>Your store information couldn't be loaded. Would you like to create a store?</p>
                <Link to="/seller/create-store" className="text-blue-600 hover:underline mt-2 inline-block">
                  Create Store
                </Link>
              </div>
            )}
          </div>
        )}
        
        {!loading && !store && !error && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">No Store Found</h2>
            <p className="mb-4">You don't appear to have a store yet. Would you like to create one now?</p>
            <Link 
              to="/seller/create-store" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Your Store
            </Link>
          </div>
        )}
        
        {/* Only show store content if store data exists */}
        {!loading && store && (
          <>
            {/* Store Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
                    {store.theme?.logo_url ? (
                      <img 
                        src={store.theme.logo_url} 
                        alt={store.store_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {store.store_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{store.store_name}</h2>
                    <p className="text-gray-500 text-sm">
                      {store.average_rating 
                        ? `Rating: ${store.average_rating.toFixed(1)}/5 (${store.ratings_count || 0} reviews)` 
                        : 'No ratings yet'}
                    </p>
                  </div>
                </div>
                
                <div className="space-x-2">
                  <Link 
                    to={`/stores/${store.subdomain_name}`} 
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    target="_blank"
                  >
                    View Store
                  </Link>
                  <Link 
                    to="/seller/edit-store" 
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Edit Store
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Total Products</h3>
                <p className="text-3xl font-bold">{products?.length || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Recent Orders</h3>
                <p className="text-3xl font-bold">{orders?.length || 0}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold">
                  ${orders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0).toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            
            {/* Products Table */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Products</h2>
                <Link 
                  to="/seller/add-product" 
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add New Product
                </Link>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You haven't added any products yet.</p>
                  <p className="mt-2">
                    <Link to="/seller/add-product" className="text-blue-600 hover:underline">
                      Click here
                    </Link> to add your first product.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map(product => (
                        <tr key={product.product_id}>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 mr-3">
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="h-10 w-10 object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                                    No img
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-gray-500 text-sm truncate w-48">
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium">${parseFloat(product.price).toFixed(2)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              product.stock > 10 ? 'bg-green-100 text-green-800' : 
                              product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-4">{product.category}</td>
                          <td className="px-4 py-4 text-right space-x-2">
                            <Link 
                              to={`/seller/edit-product/${product.product_id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                            <Link 
                              to={`/products/${product.product_id}`}
                              className="text-gray-600 hover:text-gray-900"
                              target="_blank"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link 
                  to="/seller/orders" 
                  className="text-blue-600 hover:underline text-sm"
                >
                  View All Orders
                </Link>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No orders yet. They'll appear here when customers make purchases.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.order_id}>
                          <td className="px-4 py-4">
                            {order.order_id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            {order.user?.username || 'Anonymous'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              order.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                              order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium">
                            ${parseFloat(order.total_amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link 
                              to={`/seller/orders/${order.order_id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerDashboard;
