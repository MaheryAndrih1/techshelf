import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api, { getMediaUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { applyFont } from '../../utils/fontLoader';
import CustomButton from '../../components/CustomButton';

const StoreDetailPage = () => {
  const { subdomain } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState({ score: 5, comment: '' });
  const { isAuthenticated, currentUser } = useAuth();
  const { addToCart } = useCart();
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const reviewsPerPage = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const storeContainerRef = useRef(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        // Fetch store details
        const storeResponse = await api.get(`/stores/${subdomain}/`);
        setStore(storeResponse.data);
        
        // Fetch store products
        const productsResponse = await api.get(`/products/?store=${storeResponse.data.store_id}`);
        setProducts(productsResponse.data.results || productsResponse.data);
        
        // Fetch store ratings 
        const ratingsResponse = await api.get(`/stores/${subdomain}/ratings/?limit=100`);
        console.log('Ratings data:', ratingsResponse.data);
        
        // Set ratings directly from the results array
        let allReviews = [];
        if (ratingsResponse.data?.results && Array.isArray(ratingsResponse.data.results)) {
          allReviews = ratingsResponse.data.results;
        } else if (Array.isArray(ratingsResponse.data)) {
          allReviews = ratingsResponse.data;
        }
        
        console.log(`Found ${allReviews.length} total reviews`);
        setRatings(allReviews);
        setDisplayedReviews(allReviews.slice(0, reviewsPerPage));
        setHasMoreReviews(allReviews.length > reviewsPerPage);
      } catch (err) {
        setError('Failed to load store data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoreData();
  }, [subdomain, reviewsPerPage]);

  // Apply store theme when store data loads
  useEffect(() => {
    if (store && store.theme && storeContainerRef.current) {
      // Apply theme to the store container element and document body
      const container = storeContainerRef.current;
      const theme = store.theme;
      
      // Apply primary and secondary colors as CSS variables
      container.style.setProperty('--store-primary-color', theme.primary_color || '#3498db');
      container.style.setProperty('--store-secondary-color', theme.secondary_color || '#2ecc71');
      
      // Calculate text colors based on background colors (for contrast)
      const primaryIsDark = isDarkColor(theme.primary_color);
      const secondaryIsDark = isDarkColor(theme.secondary_color);
      
      container.style.setProperty('--store-primary-text', primaryIsDark ? '#ffffff' : '#222222');
      container.style.setProperty('--store-secondary-text', secondaryIsDark ? '#ffffff' : '#222222');
      
      // Apply font if specified
      if (theme.font) {
        applyFont(container, theme.font);
        
        // Apply font to the document.body for more consistent theming
        document.body.classList.add('themed-store-page');
        applyFont(document.body, theme.font);
      }
      
      // Clean up when component unmounts
      return () => {
        document.body.classList.remove('themed-store-page');
      };
    }
  }, [store]);
  
  const isDarkColor = (hexColor) => {
    if (!hexColor) return false;
    
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return true if color is dark
    return luminance < 0.5;
  };

  const loadMoreReviews = () => {
    const nextPage = reviewsPage + 1;
    const endIndex = nextPage * reviewsPerPage;
    
    setDisplayedReviews(ratings.slice(0, endIndex));
    setReviewsPage(nextPage);
    setHasMoreReviews(endIndex < ratings.length);
    
    console.log(`Showing ${Math.min(endIndex, ratings.length)} of ${ratings.length} total reviews`);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    try {
      setIsSubmitting(true);

      const ratingData = {
        score: userRating.score,
        comment: userRating.comment
      };
      
      console.log(`Submitting rating for store ${subdomain}:`, ratingData);

      // Make API request to create/update rating
      const response = await api.post(`/stores/${subdomain}/rate/`, ratingData);
      console.log("Review submission response:", response.data);
      
      // Use the response data directly if available, otherwise create a placeholder
      const newRating = response.data || {
        rating_id: `temp-${Date.now()}`,
        score: userRating.score,
        comment: userRating.comment,
        timestamp: new Date().toISOString(),
        user: currentUser.username, 
        user_name: currentUser.username
      };
      
      // Add user information to the rating if not included in response
      if (!newRating.user_name) {
        newRating.user_name = currentUser.username;
      }
      
      const updatedRatings = [newRating, ...ratings.filter(r => 
        r.user !== currentUser.username && r.user_id !== currentUser.id
      )];
      setRatings(updatedRatings);
      
      setDisplayedReviews([newRating, ...displayedReviews.filter(r => 
        r.user !== currentUser.username && r.user_id !== currentUser.id
      )]);
      
      setSubmitSuccess('Your review was submitted successfully!');
      setTimeout(() => setSubmitSuccess(''), 3000);
      
      // Reset the form
      setUserRating({ score: 5, comment: '' });
    } catch (err) {
      console.error('Failed to submit rating:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit your review.';
      setSubmitError(errorMsg);
      setTimeout(() => setSubmitError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const storedReviewUserData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('reviewUserData') || '{}');
    } catch (err) {
      return {};
    }
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      if (!isAuthenticated) {
        sessionStorage.setItem('redirectToCartAfterAuth', 'true');
      }
      await addToCart(productId, 1);
      
    } catch (err) {
      console.error('Failed to add to cart:', err);
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

  if (error || !store) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Store not found'}
        </div>
        <div className="mt-4">
          <Link to="/stores" className="text-blue-600 hover:underline">
            &larr; Back to all stores
          </Link>
        </div>
      </Layout>
    );
  }

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

  return (
    <Layout>
      <div 
        ref={storeContainerRef} 
        className="store-container -mt-8 -mx-4 sm:-mx-6 lg:-mx-8"
        style={{
          '--store-primary-color': store?.theme?.primary_color || '#3498db',
          '--store-secondary-color': store?.theme?.secondary_color || '#2ecc71',
        }}
      >
        {/* Banner */}
        <div className="store-banner w-full relative">
          {store.theme?.banner_url ? (
            <div className="banner-image-container h-[400px] w-[100vw] overflow-hidden">
              <img 
                src={getMediaUrl(store.theme.banner_url)}
                alt={`${store.store_name} banner`}
                className="w-full h-full object-cover object-center"
              />
              <div className="banner-overlay absolute inset-0 bg-black bg-opacity-30"></div>
            </div>
          ) : (
            <div className="banner-gradient h-[400px] w-[100vw]"></div>
          )}
          
          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                {store.theme?.logo_url ? (
                  <img
                    src={getMediaUrl(store.theme.logo_url)}
                    alt={`${store.store_name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold bg-gray-700">
                    {store.store_name.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white drop-shadow-md">
                {store.store_name}
              </h1>
              
              <p className="text-xl mb-4 text-white drop-shadow-md max-w-xl">
                {store.description || 'Welcome to our store!'}
              </p>
              
              {/* Store Rating */}
              <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-lg">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className="w-5 h-5"
                      style={{
                        color: store.average_rating && star <= Math.round(store.average_rating)
                          ? '#FFD700' : '#E5E7EB'
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-medium text-black">
                  {store.average_rating 
                    ? `${store.average_rating.toFixed(1)} (${store.rating_count} ${
                        store.rating_count === 1 ? 'review' : 'reviews'
                      })`
                    : 'No ratings yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rest of the page content */}
        <div className="container mx-auto px-4 py-8">
          {/* Products Section */}
          <div className="products-section mb-16">
            <div className="section-header flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Our Products</h2>
            </div>
            
            {products.length === 0 ? (
              <div className="empty-state p-12 rounded-lg text-center">
                <svg className="mx-auto h-16 w-16 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-xl mb-6">This store hasn't added any products yet</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map(product => (
                  <div key={product.product_id} className="product-card">
                    <Link to={`/products/${product.product_id}`} className="block">
                      <div className="product-image">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="product-title line-clamp-1">{product.name}</h3>
                        <p className="product-description line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center mt-4">
                          <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                          <span className="product-stock">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-5 pt-0">
                      <SimpleButton
                        onClick={() => handleAddToCart(product.product_id)}
                        disabled={product.stock <= 0}
                        fullWidth
                        type="primary"
                      >
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </SimpleButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Reviews Section */}
          <div className="reviews-section">
            <div className="section-header mb-8">
              <h2 className="text-3xl font-bold">Customer Reviews</h2>
            </div>
            
            <div className="reviews-container">
              {/* Rating Summary */}
              <div className="rating-summary">
                <div className="rating-circle">
                  <span className="text-4xl font-bold">
                    {store.average_rating ? store.average_rating.toFixed(1) : '-'}
                  </span>
                </div>
                
                <div className="ml-4">
                  <div className="flex mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star}
                        className="w-6 h-6"
                        style={{
                          color: store.average_rating && star <= Math.round(store.average_rating)
                            ? '#FFD700' : '#E5E7EB'
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-lg text-gray-700">
                    Based on {store.rating_count || 0} {(store.rating_count === 1) ? 'review' : 'reviews'}
                  </p>
                </div>
                
                {isAuthenticated && store.user_id !== currentUser?.id && !ratings.find(r => r.user === currentUser?.username) && (
                  <CustomButton 
                    onClick={() => document.getElementById('write-review').scrollIntoView({ behavior: 'smooth' })}
                    type="secondary"
                    className="ml-auto"
                  >
                    Write a Review
                  </CustomButton>
                )}
              </div>
              
              {/* Submit a Rating Form */}
              {isAuthenticated && store.user_id !== currentUser?.id && (
                <div className="review-form" id="write-review">
                  <h3 className="text-xl font-semibold mb-6">Share Your Experience</h3>
                  
                  {submitSuccess && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {submitSuccess}
                    </div>
                  )}
                  
                  {submitError && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {submitError}
                    </div>
                  )}
                  
                  <form onSubmit={handleRatingSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="rating" className="block mb-3 text-lg font-medium">
                        Your Rating
                      </label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating({ ...userRating, score: star })}
                            className="focus:outline-none transform hover:scale-110 transition-transform"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-10 w-10 ${
                                star <= userRating.score ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="comment" className="block mb-3 text-lg font-medium">
                        Your Review
                      </label>
                      <textarea
                        id="comment"
                        rows="4"
                        value={userRating.comment}
                        onChange={(e) => setUserRating({ ...userRating, comment: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                        placeholder="Share what you liked or didn't like about this store..."
                      ></textarea>
                    </div>
                    
                    {/* Submit Review Button */}
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-[#c5630c] text-white px-4 py-2 rounded hover:bg-[#b35500] disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              {!ratings || ratings.length === 0 ? (
                <div className="empty-reviews text-center py-8">
                  <svg className="mx-auto h-16 w-16 mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xl">This store has no reviews yet</p>
                  {isAuthenticated && store.user_id !== currentUser?.id && (
                    <CustomButton 
                      onClick={() => document.getElementById('write-review').scrollIntoView({ behavior: 'smooth' })}
                      type="secondary"
                      className="mt-6"
                    >
                      Be the first to write a review
                    </CustomButton>
                  )}
                </div>
              ) : (
                <div className="reviews-list">
                  {displayedReviews.map((rating) => {
                    const username = typeof rating.user === 'string' 
                      ? rating.user 
                      : rating.user_name || rating.username || 
                        (rating.user && (typeof rating.user === 'object') ? 
                          (rating.user.username || rating.user.name) : null) || 
                        'Anonymous';
                    
                    const firstLetter = username.charAt(0).toUpperCase();
                    
                    return (
                      <div key={rating.rating_id} className="review-card">
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center">
                            <div className="review-avatar">
                              {firstLetter}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{username}</p>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-5 w-5 ${
                                      star <= rating.score ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(rating.timestamp).toLocaleDateString(undefined, {
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {rating.comment && (
                          <div className="pl-16">
                            <p className="text-gray-700">{rating.comment}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {hasMoreReviews && (
                    <div className="text-center pt-4">
                      <CustomButton 
                        onClick={loadMoreReviews}
                        type="outline"
                      >
                        See More Reviews
                      </CustomButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreDetailPage;