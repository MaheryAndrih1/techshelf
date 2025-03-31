import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api, { getMediaUrl } from '../../utils/api';

const StoreListPage = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch stores only once on component mount
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await api.get('/stores/');
        const storeData = response.data.results || response.data || [];
        setStores(storeData);
        setFilteredStores(storeData);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to load stores. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredStores(stores);
      return;
    }
    
    const lowercasedTerm = term.toLowerCase();
    const results = stores.filter(store => 
      store.store_name.toLowerCase().includes(lowercasedTerm) ||
      store.subdomain_name.toLowerCase().includes(lowercasedTerm)
    );
    
    setFilteredStores(results);
  }, [stores]);

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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Explore Stores</h1>
        
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stores..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {filteredStores.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">No stores found. Try a different search term.</p>
            <Link to="/">
              <CustomButton type="primary">
                Back to Home
              </CustomButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map(store => (
              <Link 
                key={store.store_id} 
                to={`/stores/${store.subdomain_name}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gray-200">
                  {store.theme?.banner_url ? (
                    <img 
                      src={getMediaUrl(store.theme.banner_url)} 
                      alt={`${store.store_name} banner`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-2xl font-bold">
                      {store.store_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                      {store.theme?.logo_url ? (
                        <img 
                          src={getMediaUrl(store.theme.logo_url)} 
                          alt={`${store.store_name} logo`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#c5630c] text-white text-lg font-bold">
                          {store.store_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{store.store_name}</h3>
                      <p className="text-sm text-gray-600">@{store.subdomain_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <div className="flex items-center mr-4">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{store.average_rating ? store.average_rating.toFixed(1) : 'No ratings yet'}</span>
                    </div>
                    <div>
                      {store.product_count || 0} products
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