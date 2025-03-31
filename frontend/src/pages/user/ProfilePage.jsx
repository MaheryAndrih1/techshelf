import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile/');
        setProfile(response.data);
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
        </div>
        
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
        
        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Personal Information
            </h2>
            
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
          </div>
          
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Contact Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                <p className="text-gray-800">{profile?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 text-[#33353a]">
              Address Information
            </h2>
            
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
