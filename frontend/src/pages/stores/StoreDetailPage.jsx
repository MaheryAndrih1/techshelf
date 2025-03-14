import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api, { getMediaUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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
  const navigate = useNavigate();
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const reviewsPerPage = 2;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

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
      // Set loading state for button
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

  return (
    <Layout>
      {/* Store Banner */}
      <div className="h-48 md:h-64 bg-blue-100 mb-6 overflow-hidden">
        {store.theme?.banner_url ? (
          <img 
            src={getMediaUrl(store.theme.banner_url)}
            alt={`${store.store_name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-indigo-500">
            <h1 className="text-4xl text-white font-bold">{store.store_name}</h1>
          </div>
        )}
      </div>
      
      <div className="container mx-auto px-4">
        {/* Store Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6">
            {store.theme?.logo_url ? (
              <img
                src={getMediaUrl(store.theme.logo_url)}
                alt={`${store.store_name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-3xl font-bold">
                {store.store_name.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{store.store_name}</h1>
            <p className="text-gray-600">{store.description || 'Welcome to our store!'}</p>
            
            {/* Store Rating */}
            <div className="flex items-center justify-center md:justify-start mt-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    className={`w-5 h-5 ${
                      store.average_rating && star <= Math.round(store.average_rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-600">
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
        
        {/* Products Section */}
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">This store hasn't added any products yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {products.map(product => (
              <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    <h3 className="font-medium text-gray-900 mb-2 truncate">{product.name}</h3>
                    <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">${parseFloat(product.price).toFixed(2)}</span>
                      <span className="text-sm text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleAddToCart(product.product_id)}
                    disabled={product.stock <= 0}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Ratings & Reviews Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Ratings & Reviews</h2>
            
            {/* Show overall rating*/}
            <div className="flex flex-col md:flex-row items-center justify-between border-b pb-6 mb-6">
              <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
                <p className="text-4xl font-bold">
                  {store.average_rating ? store.average_rating.toFixed(1) : '-'}
                </p>
                <div className="flex mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`w-6 h-6 ${
                        store.average_rating && star <= Math.round(store.average_rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {store.rating_count || 0} {(store.rating_count === 1) ? 'review' : 'reviews'}
                </p>
              </div>
              
              {isAuthenticated && store.user_id !== currentUser?.id && !ratings.find(r => r.user === currentUser?.username) && (
                <button 
                  onClick={() => document.getElementById('write-review').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Write a Review
                </button>
              )}
            </div>
            
            {/* Submit a Rating Form */}
            {isAuthenticated && store.user_id !== currentUser?.id && (
              <div className="mb-8 border-b pb-8" id="write-review">
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                
                {submitSuccess && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {submitSuccess}
                  </div>
                )}
                
                {submitError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {submitError}
                  </div>
                )}
                
                <form onSubmit={handleRatingSubmit}>
                  <div className="mb-4">
                    <label htmlFor="rating" className="block mb-2 text-sm font-medium text-gray-700">
                      Your Rating
                    </label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating({ ...userRating, score: star })}
                          className="focus:outline-none"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-8 w-8 ${
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
                  
                  <div className="mb-4">
                    <label htmlFor="comment" className="block mb-2 text-sm font-medium text-gray-700">
                      Your Review (Optional)
                    </label>
                    <textarea
                      id="comment"
                      rows="4"
                      value={userRating.comment}
                      onChange={(e) => setUserRating({ ...userRating, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your experience with this store"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-t-transparent border-2 border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {!ratings || ratings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">This store has no reviews yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedReviews.map((rating) => {
                  const username = typeof rating.user === 'string' 
                    ? rating.user 
                    : rating.user_name || rating.username || 
                      (rating.user && (typeof rating.user === 'object') ? 
                        (rating.user.username || rating.user.name) : null) || 
                      'Anonymous';
                  
                  const firstLetter = username.charAt(0).toUpperCase();
                  
                  return (
                    <div key={rating.rating_id} className="border-b pb-6 last:border-b-0">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-800 font-semibold">
                            {firstLetter}
                          </div>
                          <div>
                            <p className="font-medium">{username}</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 ${
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
                          {new Date(rating.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.comment && <p className="text-gray-700">{rating.comment}</p>}
                    </div>
                  );
                })}
                
                {hasMoreReviews && (
                  <div className="text-center pt-4">
                    <button 
                      onClick={loadMoreReviews}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors"
                    >
                      See More Reviews
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreDetailPage;