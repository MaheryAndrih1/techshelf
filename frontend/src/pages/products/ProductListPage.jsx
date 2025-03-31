/** @jsxRuntime classic */
/** @jsx React.createElement */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


const SimpleButton = ({ onClick, disabled, children, type = "primary", fullWidth = false, size = "medium", className = "" }) => {
  let buttonClasses = "rounded font-medium transition-colors focus:outline-none";
  
  if (size === "small") {
    buttonClasses += " px-3 py-1 text-sm";
  } else if (size === "large") {
    buttonClasses += " px-6 py-3 text-base";
  } else {
    buttonClasses += " px-4 py-2 text-sm";
  }
  
  // Width
  if (fullWidth) {
    buttonClasses += " w-full";
  }
  
  // Type variants
  if (type === "primary") {
    buttonClasses += " bg-[#c5630c] hover:bg-[#b35500] text-white";
  } else if (type === "outline") {
    buttonClasses += " border border-[#c5630c] text-[#c5630c] hover:bg-[#c5630c] hover:text-white";
  } else if (type === "secondary") {
    buttonClasses += " bg-[#a47f6f] hover:bg-[#8c6b5d] text-white";
  } else if (type === "dark") {
    buttonClasses += " bg-[#33353a] hover:bg-[#1a1f24] text-white";
  }
  
  // Disabled state
  if (disabled) {
    buttonClasses += " opacity-50 cursor-not-allowed";
  }
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${buttonClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add state to track which products are currently being added to cart
  const [addingToCart, setAddingToCart] = useState({});
  // Add state to track like operations
  const [likingProduct, setLikingProduct] = useState({});
  
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
    
    // Set a new timeout after 1400ms
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
    }, 1400);
    
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
      // Set adding state for this product
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      if (!isAuthenticated) {
        sessionStorage.setItem('redirectToCartAfterAuth', 'true');
      }
      await addToCart(productId, 1);
      
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  // Add handleLikeProduct function
  const handleLikeProduct = async (productId, isLiked) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterAuth', location.pathname);
      navigate('/login');
      return;
    }
    
    try {
      setLikingProduct(prev => ({ ...prev, [productId]: true }));
      
      if (isLiked) {
        // Unlike the product
        await api.delete(`/products/${productId}/like/`);
        
        setProducts(products.map(product => 
          product.product_id === productId 
            ? { ...product, is_liked: false, like_count: Math.max(0, (product.like_count || 0) - 1) } 
            : product
        ));
      } else {
        // Like the product
        await api.post(`/products/${productId}/like/`);
        
        setProducts(products.map(product => 
          product.product_id === productId 
            ? { ...product, is_liked: true, like_count: (product.like_count || 0) + 1 } 
            : product
        ));
      }
    } catch (err) {
      console.error('Failed to handle like operation:', err);
    } finally {
      setLikingProduct(prev => ({ ...prev, [productId]: false }));
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
          <div className="bg-white p-4 rounded shadow border-l-4 border-[#c5630c]">
            <h2 className="text-lg font-semibold mb-4 text-[#33353a]">Filters</h2>
            
            {/* Category filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-[#33353a]">Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    checked={!category}
                    onChange={() => updateFilters({ category: '' })}
                    className="mr-2 accent-[#c5630c]"
                  />
                  <label htmlFor="all-categories" className="text-gray-700">All Categories</label>
                </div>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${cat}`}
                      name="category"
                      checked={category === cat}
                      onChange={() => updateFilters({ category: cat })}
                      className="mr-2 accent-[#c5630c]"
                    />
                    <label htmlFor={`category-${cat}`} className="text-gray-700">{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price range filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-[#33353a]">Price Range</h3>
              <form onSubmit={handlePriceFilterSubmit}>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="number"
                    placeholder="Min"
                    name="minPrice"
                    value={localPriceFilters.minPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    name="maxPrice"
                    value={localPriceFilters.maxPrice}
                    onChange={handlePriceChange}
                    className="w-1/2 px-2 py-1 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                    min="0"
                  />
                </div>
                <SimpleButton
                  type="submit"
                  size="small"
                  fullWidth
                >
                  Apply Price Filter
                </SimpleButton>
              </form>
            </div>
            
            {/* Sort options */}
            <div>
              <h3 className="font-medium mb-2 text-[#33353a]">Sort By</h3>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
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
                  <div className="relative">
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
                    
                    {/* Add like button */}
                    <button 
                      onClick={() => handleLikeProduct(product.product_id, product.is_liked)}
                      className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                      disabled={likingProduct[product.product_id]}
                    >
                      {likingProduct[product.product_id] ? (
                        <div className="h-6 w-6 border-t-2 border-b-2 border-red-400 rounded-full animate-spin"></div>
                      ) : product.is_liked ? (
                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400 hover:text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <Link to={`/products/${product.product_id}`}>
                      <h3 className="font-medium text-[#33353a] mb-2">{product.name}</h3>
                    </Link>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-[#c5630c]">${parseFloat(product.price).toFixed(2)}</span>
                      <span className="text-sm text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    {/* Display like count if available */}
                    {product.like_count > 0 && (
                      <div className="text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {product.like_count} {product.like_count === 1 ? 'person likes this' : 'people like this'}
                        </span>
                      </div>
                    )}
                    
                    <SimpleButton
                      onClick={() => handleAddToCart(product.product_id)}
                      disabled={product.stock <= 0 || addingToCart[product.product_id]}
                      type="primary"
                      fullWidth
                    >
                      {addingToCart[product.product_id] ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </span>
                      ) : (
                        product.stock > 0 ? 'Add to Cart' : 'Out of Stock'
                      )}
                    </SimpleButton>
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
