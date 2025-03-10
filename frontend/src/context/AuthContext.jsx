import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      setLoading(true);
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (user && token) {
        setCurrentUser(JSON.parse(user));
        
        try {
          // Verify token is still valid by fetching profile
          const response = await api.get('/users/profile/');
          const updatedUser = response.data;
          
          // Update local storage with latest user data
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        } catch (err) {
          console.log("Token validation failed, logging out");
          // If token is invalid, log user out
          logout();
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/users/login/', {
        email,
        password
      });
      
      const { user, access, refresh } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to login';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending registration data:', userData);
      
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        password2: userData.confirmPassword
      };
      
      const response = await api.post('/users/register/', registrationData);
      
      // If registration succeeds, login the user
      if (response.data && response.data.user) {
        return login(userData.email, userData.password);
      } else {
        // If login info wasn't returned, manually login
        return login(userData.email, userData.password);
      }
    } catch (err) {
      // Improved error handling to show detailed backend validation errors
      console.error('Registration error details:', err.response?.data);
      
      const message = err.response?.data?.error || 
                     err.response?.data?.detail ||

                     (err.response?.data?.password2 ? 
                       `Password confirmation: ${err.response.data.password2[0]}` : 
                       'Registration failed. Please check your information.');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    
    // Attempt to notify server about logout (but don't wait for response)
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/users/logout/', { refresh: refreshToken }).catch(() => {});
    }
  };

  const upgradeToSeller = async () => {
    setLoading(true);
    try {
      const response = await api.post('/users/upgrade-seller/');
      
      // Update user data
      const updatedUser = { ...currentUser, role: 'SELLER' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to upgrade account';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile/', profileData);
      
      // Update user data
      localStorage.setItem('user', JSON.stringify(response.data));
      setCurrentUser(response.data);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    upgradeToSeller,
    updateProfile,
    isAuthenticated: !!currentUser,
    isSeller: currentUser?.role === 'SELLER',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
