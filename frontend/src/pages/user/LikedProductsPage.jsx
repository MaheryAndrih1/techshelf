import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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

const LikedProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login?redirect=/liked-products');
      return;
    }

    const fetchLikedProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/products/user/liked/');
        setProducts(response.data.results || response.data);
      } catch (err) {
        console.error('Failed to load your liked products:', err);
        setError('Unable to load your liked products. This feature may not be fully implemented yet.');
        // Set empty products array on error
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProducts();
  }, [isAuthenticated, navigate]);

  const handleUnlike = async (productId) => {
    try {
      await api.delete(`/products/${productId}/like/`);
      // Remove product from the list
      setProducts(products.filter(product => product.product_id !== productId));
    } catch (err) {
      console.error('Failed to unlike product:', err);
    }
  };

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-[#33353a]">Products You Like</h1>
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#33353a]">Products You Like</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold mb-4 text-[#33353a]">No Liked Products Yet</h2>
            <p className="text-gray-600 mb-6">You haven't liked any products yet. Browse our products and click the heart icon to add to your favorites.</p>
            <Link to="/products">
              <SimpleButton type="primary">
                Browse Products
              </SimpleButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg relative">
                <button 
                  onClick={() => handleUnlike(product.product_id)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-red-50 z-10"
                  aria-label="Unlike product"
                >
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
                
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
        )}
      </div>
    </Layout>
  );
};

export default LikedProductsPage;
