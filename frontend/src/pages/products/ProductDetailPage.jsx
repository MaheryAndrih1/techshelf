import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import CustomButton from '../../components/CustomButton';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const { isAuthenticated, currentUser } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${productId}/`);
        setProduct(response.data);
        
        // Check if product is already liked by current user
        if (isAuthenticated && response.data.is_liked !== undefined) {
          setLiked(response.data.is_liked);
        }
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isAuthenticated]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(Math.min(value, product?.stock || 1));
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(productId, quantity);
    } catch (err) {
    }
  };

  const handleLikeProduct = async () => {
    if (!isAuthenticated) {
      // Store current path for redirection after login
      sessionStorage.setItem('redirectAfterAuth', location.pathname);
      navigate('/login');
      return;
    }
    
    try {
      setLikeLoading(true);
      
      if (liked) {
        // Unlike the product
        await api.delete(`/products/${productId}/like/`);
        setLiked(false);
      } else {
        // Like the product
        await api.post(`/products/${productId}/like/`);
        setLiked(true);
      }
      
      // Update product data to reflect new like count
      const updatedProduct = await api.get(`/products/${productId}/`);
      setProduct(updatedProduct.data);
      
    } catch (err) {
      // Silent fail - keep UI state as is
    } finally {
      setLikeLoading(false);
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

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || "Product not found"}
          </div>
          <Link to="/products" className="text-blue-600 hover:underline">
            &larr; Back to Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="md:w-1/2 p-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {product?.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
                  No Image Available
                </div>
              )}
            </div>
          </div>
          
          {/* Product Details */}
          <div className="md:w-1/2 p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product?.name}</h1>
                <button 
                  onClick={handleLikeProduct}
                  disabled={likeLoading}
                  className={`text-gray-400 hover:text-red-500 focus:outline-none transition-colors ${liked ? 'text-red-500' : ''}`}
                  aria-label={liked ? "Unlike product" : "Like product"}
                >
                  {likeLoading ? (
                    <div className="h-8 w-8 border-t-2 border-b-2 border-red-500 rounded-full animate-spin"></div>
                  ) : liked ? (
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {product?.like_count !== undefined && (
                <div className="text-sm text-gray-500 -mt-1 mb-3">
                  {product.like_count} {product.like_count === 1 ? 'person' : 'people'} liked this product
                </div>
              )}
              
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-gray-900">${parseFloat(product?.price).toFixed(2)}</span>
                {product?.stock > 0 ? (
                  <span className="ml-3 inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                    In Stock ({product.stock})
                  </span>
                ) : (
                  <span className="ml-3 inline-block bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
              
              {/* Store information */}
              {product.store_subdomain ? (
                <div className="mb-4">
                  <p className="text-gray-600">
                    Sold by: <Link to={`/stores/${product.store_subdomain}`} className="text-blue-600 hover:underline">{product.store_name}</Link>
                  </p>
                </div>
              ) : product.store ? (
                <div className="mb-4">
                  <p className="text-gray-600">
                    Sold by: <Link to={`/stores/${product.store}`} className="text-blue-600 hover:underline">{product.store_name}</Link>
                  </p>
                </div>
              ) : null}
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-gray-700">{product.description || 'No description available.'}</p>
              </div>
              
              {product.stock > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <label htmlFor="quantity" className="block mr-4 font-medium">
                      Quantity:
                    </label>
                    <div className="flex border border-gray-300 rounded">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 bg-gray-100 border-r border-gray-300"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={product.stock}
                        className="w-16 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-3 py-1 bg-gray-100 border-l border-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <CustomButton
                    onClick={() => handleAddToCart(product.product_id)}
                    disabled={product.stock <= 0}
                    type="primary"
                    size="large"
                    fullWidth={true}
                    className="mb-4"
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </CustomButton>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                Category: {product.category}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
