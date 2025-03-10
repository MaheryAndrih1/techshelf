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
      
      let cartData = response.data || { items: [] };
      if (!Array.isArray(cartData.items)) {
        cartData.items = [];
      }
      
      const updatedItems = await Promise.all(cartData.items.map(async (item) => {
        if (!item.product || !item.product.image) {
          try {
            const productResponse = await api.get(`/products/${item.product_id}/`);
            return {
              ...item,
              product: productResponse.data
            };
          } catch (err) {
            console.error(`Failed to fetch product details for ${item.product_id}:`, err);
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
      
      await fetchCart();
      
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
    
    const previousCart = { ...cart };
    
    try {
      const response = await api.delete(`/orders/cart/remove/${productId}/`);
      
      if (response.data && Array.isArray(response.data.items)) {
        const processedItems = response.data.items.map(item => {
          const previousItem = previousCart.items?.find(prevItem => 
            prevItem.product_id === item.product_id
          );
          
          if (previousItem && previousItem.product) {
            return {
              ...item,
              product: {
                ...item.product,
                ...previousItem.product
              }
            };
          }
          return item;
        });
        
        setCart({
          ...response.data,
          items: processedItems
        });
      } else {
        setCart(response.data);
      }
      
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
    setError(null);
    
    if (quantity < 1) {
      return removeFromCart(productId);
    }
  
    if (cart && cart.items) {
      const updatedItems = cart.items.map(item => {
        if (item.product_id === productId) {
          return {
            ...item,
            quantity,
            ...(item.total_price && { 
              total_price: (parseFloat(item.price || (item.total_price / item.quantity)) * quantity).toFixed(2) 
            })
          };
        }
        return item;
      });
      
      setCart({
        ...cart,
        items: updatedItems
      });
    }
    
    try {
      const response = await api.put(`/orders/cart/update/${productId}/`, { quantity });
      
      if (response?.data?.items) {
        const processedItems = response.data.items.map(item => {
          if (!item.product && item.product_name) {
            return {
              ...item,
              product: {
                name: item.product_name,
                price: parseFloat(item.total_price) / item.quantity,
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
