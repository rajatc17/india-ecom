import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-indigo-600 shadow-lg ring-4 ring-indigo-200"></div>
        <p className="mt-4 animate-pulse text-lg font-medium text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;