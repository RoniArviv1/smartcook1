import React from 'react';

export default function Button({ children, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-blue-300 hover:bg-blue-400 text-white font-medium py-2 px-5 rounded-lg shadow-sm transition"
    >
      {children}
    </button>
  );
}
