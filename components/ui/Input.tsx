import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xl font-bold text-gray-700">{label}</label>}
      <input
        className={`w-full px-4 py-3 text-xl border-2 rounded-xl focus:outline-none focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-red-500 text-lg">{error}</span>}
    </div>
  );
};