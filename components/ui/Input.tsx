
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  const baseClasses = 'block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 text-gray-200 placeholder-gray-500 disabled:bg-gray-700';
  const combinedClasses = `${baseClasses} ${className || ''}`;

  return (
    <input className={combinedClasses} {...props} />
  );
}
