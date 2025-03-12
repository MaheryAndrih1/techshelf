import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const CreateStorePage = () => {
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    store_name: '',
    subdomain_name: '',
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
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/seller/create-store' } });
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBanner(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use FormData to properly send files
      const storeFormData = new FormData();
      storeFormData.append('store_name', formData.store_name);
      storeFormData.append('subdomain_name', formData.subdomain_name);
      storeFormData.append('primary_color', formData.primary_color);
      storeFormData.append('secondary_color', formData.secondary_color);
      storeFormData.append('font', formData.font);
      
      // Add files only if they exist
      if (logo) {
        storeFormData.append('logo_url', logo);
      }
      
      if (banner) {
        storeFormData.append('banner_url', banner);
      }
      
      console.log('Submitting store data:', {
        ...formData,
        logo: logo ? logo.name : 'No logo file',
        banner: banner ? banner.name : 'No banner file'
      });

      // Make the API request with multipart/form-data
      const response = await api.post('/stores/create/', storeFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Store created successfully!');
      console.log('Created store:', response.data);
      
      // Redirect to seller dashboard after a short delay
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create store';
      setError(errorMsg);
      console.error('Store creation error:', err.response?.data || err);
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
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Store Information</h2>
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
                  />
                </div>
                
                <div>
                  <label htmlFor="subdomain_name" className="block mb-1 text-sm font-medium text-gray-700">
                    Subdomain Name
                  </label>
                  <input
                    type="text"
                    id="subdomain_name"
                    name="subdomain_name"
                    value={formData.subdomain_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Optional - will be generated from store name"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    e.g. "your-store" for your-store.techshelf.com
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Store Theme</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="primary_color" className="block mb-1 text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    id="primary_color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleChange}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="secondary_color" className="block mb-1 text-sm font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    id="secondary_color"
                    name="secondary_color"
                    value={formData.secondary_color}
                    onChange={handleChange}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="logo_url" className="block mb-1 text-sm font-medium text-gray-700">
                    Store Logo
                  </label>
                  <input
                    type="file"
                    id="logo_url"
                    name="logo_url"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    accept="image/*"
                  />
                  {logoPreview && (
                    <div className="mt-2">
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="h-20 w-20 object-cover rounded-full"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="banner_url" className="block mb-1 text-sm font-medium text-gray-700">
                    Store Banner
                  </label>
                  <input
                    type="file"
                    id="banner_url"
                    name="banner_url"
                    onChange={handleBannerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    accept="image/*"
                  />
                  {bannerPreview && (
                    <div className="mt-2">
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="h-20 w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
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
