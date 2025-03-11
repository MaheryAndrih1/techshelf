import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { currentUser, isAuthenticated, isSeller, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const cartItemCount = cart?.items?.length || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsMenuOpen(false); 
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-blue-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              TechShelf
            </Link>
          </div>

          {/* Search Bar - Hide on mobile */}
          <div className="hidden md:block flex-grow max-w-lg mx-8">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-1 rounded-l text-gray-800 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-blue-800 px-4 py-1 rounded-r hover:bg-blue-900"
              >
                Search
              </button>
            </form>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="hover:text-blue-200" onClick={closeMenus}>Products</Link>
            <Link to="/stores" className="hover:text-blue-200" onClick={closeMenus}>Stores</Link>
            
            {/* Cart link - shown for all users */}
            <Link 
              to="/cart" 
              className="flex items-center hover:text-blue-200" 
              onClick={closeMenus}
            >
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  className="flex items-center hover:text-blue-200"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{currentUser?.username || 'Account'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg py-2 z-50">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMenus}>Profile</Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMenus}>Orders</Link>
                    <Link to="/notifications" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMenus}>Notifications</Link>
                    
                    {isSeller ? (
                      <Link to="/seller/dashboard" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMenus}>Seller Dashboard</Link>
                    ) : (
                      <Link to="/become-seller" className="block px-4 py-2 hover:bg-gray-100" onClick={closeMenus}>Become a Seller</Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200" onClick={closeMenus}>Login</Link>
                <Link to="/register" className="bg-white text-blue-600 px-4 py-1 rounded hover:bg-blue-100" onClick={closeMenus}>
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* Mobile Search */}
        {isMenuOpen && (
          <div className="md:hidden mt-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-1 rounded-l text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-blue-800 px-4 py-1 rounded-r hover:bg-blue-900"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-3 pb-3">
            <Link to="/products" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Products</Link>
            <Link to="/stores" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Stores</Link>
            
            {/* Mobile cart link */}
            <Link to="/cart" className="flex items-center py-2 hover:text-blue-200" onClick={closeMenus}>
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Profile</Link>
                <Link to="/orders" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Orders</Link>
                <Link to="/notifications" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Notifications</Link>
                
                {isSeller ? (
                  <Link to="/seller/dashboard" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Seller Dashboard</Link>
                ) : (
                  <Link to="/become-seller" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Become a Seller</Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 hover:text-blue-200 text-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Login</Link>
                <Link to="/register" className="block py-2 hover:text-blue-200" onClick={closeMenus}>Register</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
