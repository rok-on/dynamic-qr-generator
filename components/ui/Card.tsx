
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  const baseClasses = 'bg-gray-900 rounded-lg border border-gray-700 shadow-md overflow-hidden flex flex-col';
  const combinedClasses = `${baseClasses} ${className || ''}`;
  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}
