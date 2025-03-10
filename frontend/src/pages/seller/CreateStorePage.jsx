import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const CreateStorePage = () => {
  const { isAuthenticated, isSeller } = useAuth();
  const [formData, setFormData] = useState({
    store_name: '',
    subdomain_name: '',
    description: '',
    primary_color: '#3498db',
    secondary_color: '#2ecc71',
    font: 'Roboto'
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/seller/create-store' } });
      return;
    }

    if (!isSeller) {
      navigate('/become-seller');
      return;
    }
  }, [isAuthenticated, isSeller, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'store_name' && !formData.subdomain_name) {
      // Auto-generate subdomain from store name
      const subdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setFormData(prev => ({
        ...prev,
        subdomain_name: subdomain
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      if (name === 'logo') {
        setLogo(file);
        setLogoPreview(reader.result);
      } else if (name === 'banner') {
        setBanner(file);
        setBannerPreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.store_name) {
      setError('Store name is required');
      setLoading(false);
      return;
    }

    try {
      // Create FormData object for file upload
      const storeFormData = new FormData();
      storeFormData.append('store_name', formData.store_name);
      storeFormData.append('subdomain_name', formData.subdomain_name);
      storeFormData.append('description', formData.description);
      storeFormData.append('primary_color', formData.primary_color);
      storeFormData.append('secondary_color', formData.secondary_color);
      storeFormData.append('font', formData.font);

      if (logo) {
        storeFormData.append('logo', logo);
      }

      if (banner) {
        storeFormData.append('banner', banner);
      }

      // Create store
      const response = await api.post('/stores/create/', storeFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Store created successfully!');
      
      // Redirect to store dashboard
      setTimeout(() => {
        navigate(`/seller/dashboard`);
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to create store';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Your Store</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
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
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="store_name" className="block mb-1 text-sm font-medium text-gray-700">
                  Store Name*
                </label>
                <input
                  type="text"
                  id="store_name"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  maxLength={50}
                />
              </div>
              
              <div>
                <label htmlFor="subdomain_name" className="block mb-1 text-sm font-medium text-gray-700">
                  Subdomain
                </label>
                <input
                  type="text"
                  id="subdomain_name"
                  name="subdomain_name"
                  value={formData.subdomain_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="your-store-url"
                  pattern="[a-z0-9\-]+"
                  title="Only lowercase letters, numbers, and hyphens are allowed"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your store will be available at: /stores/{formData.subdomain_name || 'your-subdomain'}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                  Store Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Tell customers about your store"
                  maxLength={500}
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="logo" className="block mb-1 text-sm font-medium text-gray-700">
                  Store Logo
                </label>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 object-cover rounded-full" />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="banner" className="block mb-1 text-sm font-medium text-gray-700">
                  Store Banner
                </label>
                <input
                  type="file"
                  id="banner"
                  name="banner"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                {bannerPreview && (
                  <div className="mt-2">
                    <img src={bannerPreview} alt="Banner Preview" className="h-20 w-full object-cover rounded" />
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-2">Store Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="primary_color" className="block mb-1 text-sm font-medium text-gray-700">
                      Primary Color
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        id="primary_color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                        className="w-10 h-10 border-0 p-0"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={handleChange}
                        name="primary_color"
                        className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="secondary_color" className="block mb-1 text-sm font-medium text-gray-700">
                      Secondary Color
                    </label>
                    <div className="flex items-center">
                      <input
                        type="color"
                        id="secondary_color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        className="w-10 h-10 border-0 p-0"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        name="secondary_color"
                        className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="font" className="block mb-1 text-sm font-medium text-gray-700">
                      Font
                    </label>
                    <select
                      id="font"
                      name="font"
                      value={formData.font}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Creating Store...' : 'Create Store'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateStorePage;
