import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularStores, setPopularStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const productsResponse = await api.get('/products/?limit=8');
        setFeaturedProducts(productsResponse.data.results || productsResponse.data || []);
        
        const productResults = productsResponse.data.results || productsResponse.data || [];
        
        
        if (productResults.length > 0) {
          const uniqueCategories = new Set(productResults
            .filter(product => product?.category) 
            .map(product => product.category));
          setCategories(Array.from(uniqueCategories).slice(0, 6));
        }
        
        // Fetch popular stores
        try {
          const storesResponse = await api.get('/stores/?limit=4');
          setPopularStores(storesResponse.data.results || storesResponse.data || []);
        } catch (storeErr) {
          console.error('Failed to fetch stores:', storeErr);
          setPopularStores([]);
        }
        
      } catch (err) {
        setError('Failed to load home page data');
        console.error('Error fetching products:', err);
        setFeaturedProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 rounded-lg mb-12">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to TechShelf</h1>
          <p className="text-xl mb-8">Your one-stop marketplace for technology products</p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/products"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition duration-300"
            >
              Browse Products
            </Link>
            <Link
              to="/become-seller"
              className="px-6 py-3 bg-transparent border-2 border-white rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {/* Featured Products */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <Link to="/products" className="text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/products/${product.product_id}`}>
                    <div className="h-48 bg-gray-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">
                        {product.name}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${parseFloat(product.price).toFixed(2)}</span>
                        <span className="text-sm text-gray-500">
                          {product.store?.store_name}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
          
          {/* Categories */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(category => (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex justify-between items-center"
                >
                  <span className="font-medium text-lg">{category}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
          
          {/* Popular Stores */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Popular Stores</h2>
              <Link to="/stores" className="text-blue-600 hover:underline">
                View All Stores
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {popularStores.length > 0 ? (
                popularStores.map(store => (
                  <Link
                    key={store.store_id}
                    to={`/stores/${store.subdomain_name}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-32 bg-gray-200">
                      {store.theme?.banner_url ? (
                        <img
                          src={store.theme.banner_url}
                          alt={`${store.store_name} banner`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-xl font-bold">
                          {store.store_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden mr-3">
                          {store.theme?.logo_url ? (
                            <img
                              src={store.theme.logo_url}
                              alt={`${store.store_name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-sm font-bold">
                              {store.store_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium">{store.store_name}</h3>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-4 text-center text-gray-500 p-6">
                  No stores available at this time.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </Layout>
  );
};

export default HomePage;
