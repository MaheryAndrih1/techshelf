import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const AddProductPage = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: null
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isSeller) {
      navigate('/login');
      return;
    }
    
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/');
        setCategories(response.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    
    fetchCategories();
  }, [isAuthenticated, isSeller, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData({
      ...productData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData({
        ...productData,
        image: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('stock', productData.stock);
      formData.append('category', productData.category);
      
      if (productData.image) {
        formData.append('image', productData.image);
      }
      
      const response = await api.post('/products/create/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      navigate(`/products/${response.data.product_id}`);
    } catch (err) {
      console.error('Failed to add product:', err);
      setError(err.response?.data?.detail || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#33353a]">Add New Product</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={productData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={productData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                rows="4"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="price">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={productData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="stock">
                  Stock
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={productData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={productData.category}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-[#c5630c] focus:border-[#c5630c]"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home">Home & Kitchen</option>
                <option value="Sports">Sports & Outdoors</option>
                <option value="Toys">Toys & Games</option>
                <option value="Health">Health & Beauty</option>
                <option value="Automotive">Automotive</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="image">
                Product Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
                className="w-full p-2 border rounded"
              />
              
              {preview && (
                <div className="mt-4">
                  <p className="text-gray-700 mb-2">Preview:</p>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-40 h-40 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <CustomButton
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                variant="outline"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Product'}
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddProductPage;
