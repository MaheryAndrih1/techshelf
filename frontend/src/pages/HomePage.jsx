import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Simple button component
const SimpleButton = ({ onClick, disabled, children, type = "primary", fullWidth = false, size = "medium", className = "" }) => {
  let buttonClasses = "rounded font-medium transition-colors focus:outline-none";
  
  // Size variants
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

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularStores, setPopularStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, currentUser, isSeller } = useAuth();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        // Fetch featured products
        const productsResponse = await api.get('/products/?sort=popularity&limit=8');
        setFeaturedProducts(productsResponse.data.results || productsResponse.data);
        
        // Fetch popular stores
        const storesResponse = await api.get('/stores/?limit=4');
        setPopularStores(storesResponse.data.results || storesResponse.data);
      } catch (err) {
        console.error('Failed to fetch homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#1a1f24] to-[#33353a] text-white py-16 px-4 mb-12 rounded-lg overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/tech-pattern.svg')] bg-repeat opacity-20"></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Discover Amazing Tech Products
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-gray-200">
                Shop the latest gadgets, accessories, and digital products from stores around the world.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <SimpleButton size="large">
                    Browse Products
                  </SimpleButton>
                </Link>
                <Link to="/stores">
                  <SimpleButton type="secondary" size="large">
                    Explore Stores
                  </SimpleButton>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <img 
                src="/hero-devices.png" 
                alt="Tech Devices" 
                className="max-w-full h-auto rounded-lg shadow-2xl" 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#33353a]">Featured Products</h2>
          <Link to="/products" className="text-[#c5630c] hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map(product => (
            <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
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
                  <h3 className="font-medium text-[#33353a] mb-2 hover:text-[#c5630c]">{product.name}</h3>
                </Link>
                
                {product.store_name && (
                  <p className="text-sm text-gray-600 mb-2">
                    by <Link to={`/stores/${product.store_subdomain || product.store}`} className="text-[#a47f6f] hover:underline">{product.store_name}</Link>
                  </p>
                )}
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-[#c5630c]">${parseFloat(product.price).toFixed(2)}</span>
                  <span className="text-sm text-gray-500">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                
                <SimpleButton
                  onClick={() => handleAddToCart(product.product_id)}
                  disabled={product.stock <= 0 || addingToCart[product.product_id]}
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
      </div>

      {/* Popular Stores Section */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#33353a]">Popular Stores</h2>
          <Link to="/stores" className="text-[#c5630c] hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularStores.map(store => (
            <Link 
              key={store.store_id} 
              to={`/stores/${store.subdomain_name}`}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-32 bg-gradient-to-r from-[#c5630c] to-[#a47f6f] relative">
                {store.theme?.banner_url && (
                  <img
                    src={store.theme.banner_url.startsWith('http') ? store.theme.banner_url : `/media/${store.theme.banner_url}`}
                    alt={`${store.store_name} banner`}
                    className="w-full h-full object-cover"
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                )}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className="w-16 h-16 rounded-full bg-white p-1">
                    {store.theme?.logo_url ? (
                      <img
                        src={store.theme.logo_url.startsWith('http') ? store.theme.logo_url : `/media/${store.theme.logo_url}`}
                        alt={`${store.store_name} logo`}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center bg-[#33353a] text-white text-xl font-bold">${store.store_name.charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center bg-[#33353a] text-white text-xl font-bold">
                        {store.store_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 pt-12 text-center">
                <h3 className="font-semibold text-lg text-[#33353a] mb-1">{store.store_name}</h3>
                
                {store.average_rating ? (
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(store.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-sm text-gray-500">
                      ({store.rating_count || 0})
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">No ratings yet</p>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {store.description || 'Explore this store to discover amazing products.'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-[#1a1f24] text-white rounded-lg p-8 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Tech Business Today</h2>
          <p className="text-lg mb-6">Join TechShelf as a seller and reach customers all around the world.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={!isAuthenticated ? "/login" : 
                     isSeller ? "/seller/dashboard" : "/become-seller"}>
              <SimpleButton size="large">
                {!isAuthenticated ? "Sign In to Start" : 
                 isSeller ? "Seller Dashboard" : "Become a Seller"}
              </SimpleButton>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;