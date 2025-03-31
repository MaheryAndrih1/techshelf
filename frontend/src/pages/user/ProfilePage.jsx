import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const ProfilePage = () => {
  const { currentUser, updateUserInfo } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    bio: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile/');
        setProfile(response.data);
        
        // Initialize form data with user info
        setFormData({
          username: response.data.username || '',
          email: response.data.email || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          bio: response.data.bio || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          postal_code: response.data.postal_code || '',
          country: response.data.country || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSuccessMessage('');

    try {
      // Create a copy of formData with only the fields that are different from profile
      const updatedData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== profile[key] && formData[key] !== '') {
          updatedData[key] = formData[key];
        }
      });

      // Check if there are any changes
      if (Object.keys(updatedData).length === 0) {
        setIsEditing(false);
        return;
      }

      // Send the update request
      const response = await api.put('/users/profile/', updatedData);
      
      // Update the profile state with the response data
      setProfile(response.data);
      
      // Update the auth context if needed
      updateUserInfo(response.data);
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSubmitError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitLoading(false);
      
      // Auto-hide success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="relative mb-8">
          <div className="h-48 rounded-t-xl bg-gradient-to-r from-[#33353a] to-[#1a1f24] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#c5630c]/80 to-[#a47f6f]/50 mix-blend-multiply"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/abstract-pattern.svg')] opacity-20"></div>
          </div>
          
          <div className="absolute -bottom-16 left-8 w-32 h-32 border-4 border-white rounded-full bg-[#c5630c] flex items-center justify-center text-white text-4xl font-bold uppercase">
            {profile?.first_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            {!isEditing ? (
              <CustomButton 
                onClick={() => setIsEditing(true)}
                type="outline"
                size="small"
              >
                Edit Profile
              </CustomButton>
            ) : (
              <>
                <CustomButton 
                  onClick={() => setIsEditing(false)}
                  type="outline"
                  size="small"
                >
                  Cancel
                </CustomButton>
                <CustomButton 
                  onClick={handleSubmit}
                  type="primary"
                  size="small"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Save Changes'}
                </CustomButton>
              </>
            )}
          </div>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        {/* Submit Error */}
        {submitError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {submitError}
          </div>
        )}
        
        {/* Profile Content */}
        <div className="pt-16 pb-6 px-4 md:px-8 bg-white rounded-lg shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-[#33353a]">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile?.username}
              </h1>
              <p className="text-gray-500">{profile?.email}</p>
              {profile?.bio && <p className="mt-2 text-gray-700">{profile.bio}</p>}
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              {profile?.is_seller && (
                <span className="bg-[#c5630c] text-white px-3 py-1 rounded-full text-sm">Seller</span>
              )}
              {profile?.is_staff && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Admin</span>
              )}
              <span className="bg-[#a47f6f] text-white px-3 py-1 rounded-full text-sm">
                Member since {new Date(profile?.date_joined).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Profile Form - Edit Mode or View Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Personal Information
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  ></textarea>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Username</h3>
                  <p className="text-gray-800">{profile?.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="text-gray-800">{profile?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="text-gray-800">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Not provided'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                  <p className="text-gray-800">{profile?.bio || 'No bio provided'}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Contact Information
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                  <p className="text-gray-800">{profile?.phone || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Address Information
            </h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select 
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  >
                    <option value="">Select a country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="BR">Brazil</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.address ? (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Address</h3>
                      <p className="text-gray-800">{profile.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">City</h3>
                      <p className="text-gray-800">{profile.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">State/Province</h3>
                      <p className="text-gray-800">{profile.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Postal Code</h3>
                      <p className="text-gray-800">{profile.postal_code || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Country</h3>
                      <p className="text-gray-800">{profile.country || 'Not provided'}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-600 italic">No address information provided.</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Account Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
            Account Activity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#33353a] mb-2">Orders</h3>
              <p className="text-3xl font-bold text-[#c5630c]">{profile?.order_count || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total orders placed</p>
              <CustomButton
                type="outline" 
                size="small" 
                className="mt-4"
                onClick={() => navigate('/orders')}
              >
                View Orders
              </CustomButton>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#33353a] mb-2">Wishlisted</h3>
              <p className="text-3xl font-bold text-[#c5630c]">{profile?.liked_count || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Products you like</p>
              <CustomButton
                type="outline" 
                size="small" 
                className="mt-4"
                onClick={() => navigate('/liked-products')}
              >
                View Liked
              </CustomButton>
            </div>
            
            {profile?.is_seller && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#33353a] mb-2">Store</h3>
                <p className="text-3xl font-bold text-[#c5630c]">{profile?.store_product_count || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Products in your store</p>
                <CustomButton
                  type="outline" 
                  size="small" 
                  className="mt-4"
                  onClick={() => navigate('/seller/dashboard')}
                >
                  Seller Dashboard
                </CustomButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
