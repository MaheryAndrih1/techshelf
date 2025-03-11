import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';

const StoreListPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const url = searchTerm 
          ? `/stores/?search=${encodeURIComponent(searchTerm)}`
          : '/stores/';
        
        const response = await api.get(url);
        setStores(response.data.results || response.data);
      } catch (err) {
        setError('Failed to load stores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, [searchTerm]);
  
  const handleSearch = (e) => {
    e.preventDefault();
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Stores</h1>
          
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {stores.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">No stores found</p>
            <Link to="/" className="text-blue-600 hover:underline">
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(store => (
              <Link
                key={store.store_id}
                to={`/stores/${store.subdomain_name}`}
                className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-40 bg-blue-100">
                  {store.theme?.banner_url ? (
                    <img 
                      src={store.theme.banner_url} 
                      alt={`${store.store_name} banner`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-4xl font-bold">
                      {store.store_name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                      {store.theme?.logo_url ? (
                        <img
                          src={store.theme.logo_url}
                          alt={`${store.store_name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-xl font-bold">
                          {store.store_name.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-semibold">{store.store_name}</h2>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Products: {store.product_count || 0}</span>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span>{store.average_rating?.toFixed(1) || 'New'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StoreListPage;
