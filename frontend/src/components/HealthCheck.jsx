import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const HealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health/');
      setHealth(response.data);
    } catch (err) {
      setError('Failed to check API health status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">API Health Status</h2>
      
      {loading && (
        <div className="flex justify-center my-4">
          <div className="loader"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {health && (
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-1 rounded text-sm ${health.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {health.status}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="font-medium">Database:</span>
            <span className={`px-2 py-1 rounded text-sm ${health.database === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {health.database}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="font-medium">Timestamp:</span>
            <span className="text-gray-600">{new Date(health.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}
      
      <button
        onClick={checkHealth}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        Refresh Status
      </button>
    </div>
  );
};

export default HealthCheck;
