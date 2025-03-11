import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'techshelf_guest_cart';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {

      const guestCart = loadGuestCart();
      setCart(guestCart);
    }
  }, [isAuthenticated]);

  // Save guest cart to localStorage
  const saveGuestCart = (cartData) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartData));
    return cartData;
  };

  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    } catch (err) {
      console.error("Error loading guest cart:", err);
    }
    // Return empty cart if no saved cart or error
    return { items: [], total: 0, subtotal: 0 };
  };

  // Merge guest cart with user cart after login
  const mergeCartsAfterLogin = async () => {
    const guestCart = loadGuestCart();
    console.log("Guest cart to merge:", guestCart);
    
    if (guestCart?.items?.length > 0) {
      try {
        setLoading(true);
        console.log(`Attempting to merge ${guestCart.items.length} items from guest cart`);
        
        for (const item of guestCart.items) {
          const productId = item.product_id || (item.product && item.product.product_id);
          if (productId) {
            console.log(`Adding product ${productId} with quantity ${item.quantity} to user cart`);
            try {
              await api.post('/orders/cart/add/', {
                product_id: productId,
                quantity: item.quantity
              });
            } catch (itemErr) {
              console.error(`Failed to add product ${productId} to cart:`, itemErr);
            }
          }
        }
        
        // Clear guest cart after merging
        localStorage.removeItem(GUEST_CART_KEY);
        console.log("Guest cart cleared from localStorage");
        
        await fetchCart();
        console.log("Cart refreshed after merging");
      } catch (err) {
        console.error('Failed to merge carts:', err);
        setError('Failed to merge guest cart with your account cart');
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      console.log("No guest cart items to merge");
    }
  };

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

  // Add product to cart (works for both guest and logged-in users)
  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated) {
        // Logged-in user - use API
        const response = await api.post('/orders/cart/add/', {
          product_id: productId,
          quantity,
        });
        
        await fetchCart();
        return response.data;
      } else {
        // Guest user - use local storage
        const productResponse = await api.get(`/products/${productId}/`);
        const product = productResponse.data;
        
        // Get current guest cart
        const guestCart = loadGuestCart();
        
        // Check if product already exists in cart
        const existingItemIndex = guestCart.items.findIndex(item => 
          item.product_id === productId
        );
        
        if (existingItemIndex >= 0) {
          // Update quantity if product already in cart
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item to cart
          guestCart.items.push({
            product_id: productId,
            quantity: quantity,
            price: product.price,
            product: product
          });
        }
        
        const subtotal = guestCart.items.reduce(
          (sum, item) => sum + (parseFloat(item.price) * item.quantity),
          0
        );
        
        guestCart.subtotal = subtotal;
        guestCart.total = subtotal; 
        
        const updatedCart = saveGuestCart(guestCart);
        setCart(updatedCart);
        return updatedCart;
      }
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
      if (isAuthenticated) {
        // Logged-in user - use API
        const previousCart = { ...cart };
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
      } else {
        // Guest user - use local storage
        const guestCart = loadGuestCart();
        
        // Remove item
        const updatedItems = guestCart.items.filter(item => 
          item.product_id !== productId
        );
        
        // Update cart
        const updatedCart = {
          ...guestCart,
          items: updatedItems,
          subtotal: updatedItems.reduce(
            (sum, item) => sum + (parseFloat(item.price) * item.quantity),
            0
          )
        };
        updatedCart.total = updatedCart.subtotal;
        
        // Save and update state
        saveGuestCart(updatedCart);
        setCart(updatedCart);
        return updatedCart;
      }
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
  
    if (isAuthenticated) {
      // Logged-in user flow
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
    } else {
      // Guest user flow
      const guestCart = loadGuestCart();
      
      // Update item quantity
      const updatedItems = guestCart.items.map(item => {
        if (item.product_id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      
      // Recalculate totals
      const subtotal = updatedItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity),
        0
      );
      
      // Update cart
      const updatedCart = {
        ...guestCart,
        items: updatedItems,
        subtotal,
        total: subtotal
      };
      
      // Save and update state
      saveGuestCart(updatedCart);
      setCart(updatedCart);
      return updatedCart;
    }
  };

  const applyPromotion = async (discountCode) => {
    if (!isAuthenticated) {
      setError("Please log in to apply promotion codes");
      throw new Error("Login required to apply promotions");
    }
    
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
    if (!isAuthenticated) {
      throw new Error("Login required for checkout");
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we pass the save_card flag correctly
      const response = await api.post('/orders/checkout/', {
        ...checkoutData,
        save_card: checkoutData.save_card || false
      });
      
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

  const clearGuestCart = () => {
    localStorage.removeItem(GUEST_CART_KEY);
    if (!isAuthenticated) {
      setCart({ items: [], total: 0, subtotal: 0 });
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
    mergeCartsAfterLogin,
    clearGuestCart,
    isGuestCart: !isAuthenticated && cart?.items?.length > 0,
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
