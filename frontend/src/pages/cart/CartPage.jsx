import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CartPage = () => {
  const { cart, loading, removeFromCart, updateQuantity, applyPromotion, isGuestCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    if (!isAuthenticated) {
      setPromoError('Please log in to apply promotional codes');
      return;
    }
    
    try {
      setPromoError('');
      await applyPromotion(promoCode);
      setPromoCode('');
    } catch (err) {
      setPromoError(err.message);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const cartTotals = useMemo(() => {
    if (!cart?.items) return { subtotal: 0, total: 0, itemCount: 0 };
    
    return cart.items.reduce((acc, item) => ({
      subtotal: acc.subtotal + (parseFloat(item.product?.price || item.price || 0) * item.quantity),
      total: cart.total || acc.subtotal,
      itemCount: acc.itemCount + item.quantity
    }), { subtotal: 0, total: 0, itemCount: 0 });
  }, [cart]);

  const CartItem = ({ item }) => {
    const productName = extractProductName(item);
    const productPrice = extractProductPrice(item);
    const productId = item.product_id || (item.product?.product_id) || item.id;
    const [quantity, setQuantity] = useState(item.quantity || 1);
    const [updating, setUpdating] = useState(false);
    
    const productImage = item.product?.image || 
                         (typeof item.image === 'string' ? item.image : null);
    
    function extractProductName(item) {
      if (item.product_name) return item.product_name;
      if (item.product?.name) return item.product.name;
      

      const id = item.product_id || '';
      return id.startsWith('prod_') ? 
        id.substring(5).split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') : 'Product';
    }
    
    function extractProductPrice(item) {
      if (item.price && !isNaN(parseFloat(item.price))) 
        return parseFloat(item.price);
      if (item.product?.price && !isNaN(parseFloat(item.product.price))) 
        return parseFloat(item.product.price);
      if (item.total_price && item.quantity && !isNaN(parseFloat(item.total_price)) && item.quantity > 0) 
        return parseFloat(item.total_price) / item.quantity;
      return 0;
    }
    
    useEffect(() => {
      if (item.quantity !== quantity && !updating) {
        setQuantity(item.quantity);
      }
    }, [item.quantity]);
    
    useEffect(() => {
      if (quantity === item.quantity) return;
      
      const timer = setTimeout(async () => {
        setUpdating(true);
        try {
          await handleQuantityChange(productId, quantity);
        } catch (err) {
          setQuantity(item.quantity);
          console.error('Failed to update quantity:', err);
        } finally {
          setUpdating(false);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }, [quantity, productId, item.quantity]);
    
    return (
      <div className="flex items-center py-4 border-b">
        <div className="w-2/5 flex items-center">
          <div className="w-16 h-16 bg-gray-200 mr-4 flex items-center justify-center relative overflow-hidden">
            {productImage ? (
              <img 
                src={productImage} 
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-500">${productName.charAt(0).toUpperCase()}</div>`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-gray-500">
                {productName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div>
            <Link to={`/products/${productId}`} className="text-blue-600 hover:underline font-medium">
              {productName}
            </Link>
            <button 
              onClick={() => handleRemoveItem(productId)}
              className="block text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="w-1/5 text-center">
          ${productPrice.toFixed(2)}
        </div>

        <div className="w-1/5 text-center">
          <div className="relative">
            <input
              type="number"
              min="1"
              max={item.product?.stock || 99}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className={`w-16 border rounded text-center py-1 ${updating ? 'bg-gray-100' : ''}`}
            />
            {updating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/5 text-right font-semibold">
          ${(productPrice * quantity).toFixed(2)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Link to="/products" className="inline-block bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart ({cartTotals.itemCount} items)</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex font-bold text-gray-500 pb-2 border-b">
              <div className="w-2/5">Product</div>
              <div className="w-1/5 text-center">Price</div>
              <div className="w-1/5 text-center">Quantity</div>
              <div className="w-1/5 text-right">Total</div>
            </div>
            
            {cart.items?.map(item => (
              <CartItem key={item.id || item.product_id} item={item} />
            ))}
          </div>
          
          <div className="bg-gray-50 p-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">${cartTotals.subtotal.toFixed(2)}</span>
            </div>
            
            {cart.discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Discount:</span>
                <span>-${cart.discount.toFixed(2)}</span>
              </div>
            )}
            
            {!isGuestCart && (
              <>
                <div className="flex justify-between mb-2">
                  <span>Shipping:</span>
                  <span>${cart.shipping_cost?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span>Tax:</span>
                  <span>${cart.tax?.toFixed(2) || '0.00'}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
              <span>Total:</span>
              <span>${cartTotals.total.toFixed(2)}</span>
            </div>
            
            <form onSubmit={handleApplyPromo} className="flex mt-4">
              <input
                type="text"
                placeholder="Promotion code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-grow border rounded-l px-4 py-2"
              />
              <button 
                type="submit"
                className="bg-gray-800 text-white px-4 py-2 rounded-r hover:bg-gray-700"
              >
                Apply
              </button>
            </form>
            
            {promoError && (
              <p className="text-red-500 text-sm mt-1">{promoError}</p>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Link 
                to="/products" 
                className="text-center bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded"
              >
                Continue Shopping
              </Link>
              <button 
                onClick={handleCheckout}
                className="text-center flex-grow bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
