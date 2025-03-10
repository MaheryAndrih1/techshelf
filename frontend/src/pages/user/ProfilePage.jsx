import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { currentUser, updateProfile, isAuthenticated, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    firstName: currentUser?.first_name || '',
    lastName: currentUser?.last_name || '',
    phone: currentUser?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/profile' } });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Username</h2>
                    <p className="mt-1">{currentUser?.username}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Email</h2>
                    <p className="mt-1">{currentUser?.email}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">First Name</h2>
                    <p className="mt-1">{currentUser?.first_name || '-'}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Last Name</h2>
                    <p className="mt-1">{currentUser?.last_name || '-'}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Phone</h2>
                    <p className="mt-1">{currentUser?.phone || '-'}</p>
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-gray-500">Account Type</h2>
                    <p className="mt-1">{currentUser?.role === 'SELLER' ? 'Seller' : 'Customer'}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">My Orders</h2>
              <p className="text-gray-600 mb-4">View and track your orders</p>
              <Link to="/orders" className="text-blue-600 hover:underline">
                View Orders &rarr;
              </Link>
            </div>
          </div>
          
          {currentUser?.role === 'SELLER' ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Seller Dashboard</h2>
                <p className="text-gray-600 mb-4">Manage your store and products</p>
                <Link to="/seller/dashboard" className="text-blue-600 hover:underline">
                  Go to Dashboard &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Become a Seller</h2>
                <p className="text-gray-600 mb-4">Start selling your products on TechShelf</p>
                <Link to="/become-seller" className="text-blue-600 hover:underline">
                  Learn More &rarr;
                </Link>
              </div>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Notifications</h2>
              <p className="text-gray-600 mb-4">Check your notifications</p>
              <Link to="/notifications" className="text-blue-600 hover:underline">
                View Notifications &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
