import React from 'react';

const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm'>
        <div className='flex flex-col items-center'>
          <div className='h-16 w-16 rounded-full bg-indigo-600 shadow-lg animate-spin border-4 border-t-transparent'></div>
          {message && <p className='mt-4 text-lg font-medium text-gray-700 animate-pulse'>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 bg-white/80 animate-pulse cursor-wait'></div>
  );
};

export default Loader;
