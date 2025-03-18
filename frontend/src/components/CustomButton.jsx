import React from 'react';

const CustomButton = ({title, rightIcon}) => {
  return (
    <button
      className="relative flex items-center justify-center w-50 h-15 bg-orange-500 overflow-hidden transition-all duration-300 ease-in-out hover:bg-orange-600 group"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gray-800 transition-all duration-300 ease-in-out group-hover:h-0"></div>

      <span className="relative z-10 text-white font-semibold tracking-wider border-2 border-white px-2 py-1 flex items-center gap-2">
        {title}{rightIcon && <span className='mx-2 me-0 p-0'>{rightIcon}</span>}
      </span>
    </button>
  );
};

export default CustomButton;
