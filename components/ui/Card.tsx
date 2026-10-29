import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  );
};