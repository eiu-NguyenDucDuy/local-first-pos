import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label htmlFor={inputId} className="text-xl font-bold text-gray-700">{label}</label>}
      <input id={inputId} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? inputId + '-error' : undefined}
        className={`w-full px-4 py-3 text-xl text-gray-900 border-2 rounded-xl focus:outline-none focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`} {...props} />
      {error && <span id={inputId + '-error'} className="text-red-500 text-lg">{error}</span>}
    </div>
  );
};
