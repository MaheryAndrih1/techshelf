import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Local state for price filters with debounce
  const [localPriceFilters, setLocalPriceFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });
  const [priceFilterTimeout, setPriceFilterTimeout] = useState(null);
  
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/products/';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await api.get(url);
        setProducts(response.data.results || response.data);
        
        // Extract unique categories
        const uniqueCategories = new Set(
          (response.data.results || response.data || [])
          .filter(product => product?.category)
          .map(product => product.category)
        );
        setCategories(Array.from(uniqueCategories));
        
      } catch (err) {
        setError("Failed to load products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [search, category, sort, minPrice, maxPrice]);
  
  // Update local price filter state when URL params change
  useEffect(() => {
    setLocalPriceFilters({
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
  }, [searchParams]);
  
  const updateFilters = (newFilters) => {
    const current = {};
    for (const [key, value] of searchParams.entries()) {
      current[key] = value;
    }
    
    setSearchParams({
      ...current,
      ...newFilters
    });
  };
  
  // Handle price filter change with debounce
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    
    setLocalPriceFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing timeout
    if (priceFilterTimeout) {
      clearTimeout(priceFilterTimeout);
    }
    
    // Set a new timeout to update URL params after 800ms of inactivity
    const timeoutId = setTimeout(() => {
      if (name === 'minPrice' || name === 'maxPrice') {
        const updates = {};
        
        if (name === 'minPrice') {
          updates.minPrice = value || '';
        } else {
          updates.maxPrice = value || '';
        }
        
        updateFilters(updates);
      }
    }, 800);
    
    setPriceFilterTimeout(timeoutId);
  };
  
  // Handle form submission for price filters
  const handlePriceFilterSubmit = (e) => {
    e.preventDefault();
    
    // Clear any pending timeout
    if (priceFilterTimeout) {
      clearTimeout(priceFilterTimeout);
      setPriceFilterTimeout(null);
    }
    
    // Apply both filters immediately
    updateFilters({
      minPrice: localPriceFilters.minPrice || '',
      maxPrice: localPriceFilters.maxPrice || ''
    });
  };
  
  const handleAddToCart = async (productId) => {
    try {
      if (!isAuthenticated) {
        sessionStorage.setItem('redirectToCartAfterAuth', 'true');
      }
      await addToCart(productId, 1);
      
    } catch (err) {
      console.error("Failed to add to cart:", err);
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

  return (
    <Layout>
      <div className="flex flex-col md:flex-row">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            
            {/* Category filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    checked={!category}
                    onChange={() => updateFilters({ category: '' })}
                    className="mr-2"
                  />
                  <label htmlFor="all-categories">All Categories</label>
                </div>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${cat}`}
                      name="category"
                      checked={category === cat}
                      onChange={() => updateFilters({ category: cat })}
                      className="mr-2"
                    />
                    <label htmlFor={`category-${cat}`}>{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price range filter - UPDATED with form */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Price Range</h3>
              <form onSubmit={handlePriceFilterSubmit}>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min"
                    name="minPrice"
                    value={localPriceFilters.minPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    name="maxPrice"
                    value={localPriceFilters.maxPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded"
                    min="0"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Apply Price Filter
                </button>
              </form>
            </div>
            
            {/* Sort options */}
            <div>
              <h3 className="font-medium mb-2">Sort By</h3>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Product grid */}
        <div className="flex-1">
          {search && (
            <div className="mb-4">
              <h2 className="text-xl">Search results for: "{search}"</h2>
            </div>
          )}
          
          {category && (
            <div className="mb-4">
              <h2 className="text-xl">Category: {category}</h2>
            </div>
          )}
          
          {products.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-center">
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-gray-500 mt-2">Try changing your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.product_id} className="bg-white rounded shadow overflow-hidden">
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
                  </Link>
                  
                  <div className="p-4">
                    <Link to={`/products/${product.product_id}`}>
                      <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                    </Link>
                    
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold">${parseFloat(product.price).toFixed(2)}</span>
                      <span className="text-sm text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(product.product_id)}
                      disabled={product.stock <= 0}
                      className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductListPage;
