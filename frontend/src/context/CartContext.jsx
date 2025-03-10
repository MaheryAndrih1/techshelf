import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await api.get('/orders/cart/');
      console.log('Raw cart data from API:', response.data);
      
      // Initialize cartData with proper structure
      let cartData = response.data || { items: [] };
      if (!Array.isArray(cartData.items)) {
        cartData.items = [];
      }
      
      // For each item, make sure we load the full product details if they're missing
      const updatedItems = await Promise.all(cartData.items.map(async (item) => {
        // If the product details are missing or incomplete
        if (!item.product || !item.product.name || item.product.name === "Unknown Product") {
          try {
            // Fetch the product details directly
            const productResponse = await api.get(`/products/${item.product_id}/`);
            return {
              ...item,
              product: productResponse.data
            };
          } catch (err) {
            console.error(`Failed to fetch product details for ${item.product_id}:`, err);
            // Return the item with basic product info
            return {
              ...item,
              product: {
                name: `Product ${item.product_id.split('_')[1] || ''}`,
                price: item.price || 0,
                image: null,
                stock: 10
              }
            };
          }
        }
        return item;
      }));
      
      cartData.items = updatedItems;
      setCart(cartData);
    } catch (err) {
      setError('Failed to fetch cart');
      console.error('Cart fetch error:', err);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/orders/cart/add/', {
        product_id: productId,
        quantity,
      });
      
      setCart(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add item to cart';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/orders/cart/remove/${productId}/`);
      setCart(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to remove item from cart';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    // Don't show global loading indicator for quantity updates
    setError(null);
    
    if (quantity < 1) {
      // If quantity is less than 1, just remove the item
      return removeFromCart(productId);
    }
  
    // Update cart optimistically - preserve structure
    if (cart && cart.items) {
      const updatedItems = cart.items.map(item => {
        if (item.product_id === productId) {
          // Keep the same structure but update the quantity
          return {
            ...item,
            quantity,
            // If item has a total_price property, update it
            ...(item.total_price && { 
              total_price: (parseFloat(item.price || (item.total_price / item.quantity)) * quantity).toFixed(2) 
            })
          };
        }
        return item;
      });
      
      // Update local state immediately for responsive UI
      setCart({
        ...cart,
        items: updatedItems
      });
    }
    
    try {
      const response = await api.put(`/orders/cart/update/${productId}/`, { quantity });
      
      // Process server response to maintain product data consistency
      if (response?.data?.items) {
        const processedItems = response.data.items.map(item => {
          // If the item doesn't have product details but has product_name
          if (!item.product && item.product_name) {
            // Create a compatible product structure
            return {
              ...item,
              product: {
                name: item.product_name,
                price: parseFloat(item.total_price) / item.quantity,
                // Keep image if we had it before
                image: cart?.items?.find(i => i.product_id === item.product_id)?.product?.image || null
              }
            };
          }
          return item;
        });
        
        setCart({
          ...response.data,
          items: processedItems
        });
      }
      
      return cart;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update cart';
      setError(message);
      
      // Refresh cart to get back to a valid state
      await fetchCart();
      throw new Error(message);
    }
  };

  const applyPromotion = async (discountCode) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/orders/promotions/apply/', {
        discount_code: discountCode,
      });
      
      // Refresh cart to show updated prices
      await fetchCart();
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Invalid discount code';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (checkoutData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/orders/checkout/', checkoutData);
      
      // Clear cart after successful checkout
      setCart(null);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Checkout failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromotion,
    checkout,
    refreshCart: fetchCart,
    itemCount: cart?.items?.length || 0,
    cartTotal: cart?.total || 0,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
