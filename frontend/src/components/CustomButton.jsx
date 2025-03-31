import React from 'react';

const CustomButton = ({ 
  children, 
  onClick, 
  type = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  fullWidth = false,
  ...props 
}) => {
  // Base classes
  const baseClasses = 'font-medium transition-all duration-200 rounded-lg focus:outline-none';
  
  // Type classes
  const typeClasses = {
    primary: 'bg-[#c5630c] hover:bg-[#e17a1d] active:bg-[#9e4f09] text-white border-2 border-[#c5630c] hover:border-[#e17a1d]',
    secondary: 'bg-[#a47f6f] hover:bg-[#b59485] text-white border-2 border-[#a47f6f] hover:border-[#b59485]',
    outline: 'bg-transparent border-2 border-[#c5630c] text-[#c5630c] hover:bg-[#c5630c] hover:text-white',
    dark: 'bg-[#33353a] hover:bg-[#1a1f24] text-white border-2 border-[#33353a]',
    light: 'bg-white hover:bg-gray-100 text-[#33353a] border-2 border-gray-200 hover:border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-600'
  };
  
  // Size classes
  const sizeClasses = {
    small: 'text-xs py-1 px-3',
    medium: 'text-sm py-2 px-4',
    large: 'text-base py-3 px-6',
    xl: 'text-lg py-4 px-8'
  };
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : 'hover:transform hover:-translate-y-1 hover:shadow-md';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${typeClasses[type]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;
