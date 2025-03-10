import React from 'react';
import HealthCheck from './components/HealthCheck';

const App = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className='text-3xl font-bold text-center mb-6'>TechShelf API</h1>
      <HealthCheck />
    </div>
  );
}

export default App;
