import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const { isAuthenticated, currentUser } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}/`);
        setProduct(response.data);
        
        if (isAuthenticated && currentUser) {
          try {
            setLiked(response.data.likes && response.data.likes.includes(currentUser.userId));
          } catch (err) {
            console.error("Error checking like status", err);
          }
        }
      } catch (err) {
        setError("Failed to load product details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, isAuthenticated, currentUser]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(Math.max(1, Math.min(value, product?.stock || 1)));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    try {
      await addToCart(productId, quantity);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const handleLikeProduct = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    try {
      await api.post(`/products/${productId}/like/`);
      setLiked(!liked);
      
      // Update product like count
      setProduct(prev => ({
        ...prev,
        likes_count: liked ? (prev.likes_count - 1) : (prev.likes_count + 1)
      }));
    } catch (err) {
      console.error("Failed to like product:", err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Product not found"}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Product Image */}
        <div className="md:w-1/2">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[300px] bg-gray-200 flex items-center justify-center text-gray-500">
              No Image Available
            </div>
          )}
        </div>
        
        {/* Product Details */}
        <div className="md:w-1/2 p-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <button
              onClick={handleLikeProduct}
              className={`flex items-center ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
              disabled={!isAuthenticated}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="ml-1">{product.likes_count || 0}</span>
            </button>
          </div>
          
          <div className="flex items-center mb-4">
            <Link 
              to={`/stores/${product.store?.subdomain_name}`} 
              className="text-blue-600 hover:underline"
            >
              {product.store?.store_name}
            </Link>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mb-4">
            ${parseFloat(product.price).toFixed(2)}
          </div>
          
          <div className="mb-4">
            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {product.stock > 10 
                ? 'In Stock' 
                : product.stock > 0 
                  ? `Only ${product.stock} left` 
                  : 'Out of Stock'
              }
            </span>
            
            <span className="inline-block ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
              {product.category}
            </span>
          </div>
          
          <p className="text-gray-700 mb-6">
            {product.description}
          </p>
          
          {product.stock > 0 && (
            <div className="flex items-center mb-6">
              <div className="mr-4">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 border border-gray-300 rounded px-3 py-2"
                />
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                {cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-2">Product Details</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Product ID: {product.product_id}</li>
              {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Related Products (placeholder for future implementation) */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">You might also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Related products would go here */}
          <div className="bg-gray-100 p-4 rounded text-center text-gray-500">
            Related products coming soon
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
