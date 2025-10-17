import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'normal' | 'icon';

// Fix: Make Button a polymorphic component to support the 'as' prop for rendering different elements like 'span'.
// This change makes the component more flexible and type-safe, resolving TypeScript errors in CustomizeQrModal.tsx.
type ButtonOwnProps<C extends React.ElementType> = {
  as?: C;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

export default function Button<C extends React.ElementType = 'button'>({
  children,
  className,
  variant = 'primary',
  size = 'normal',
  as,
  ...props
}: ButtonProps<C>) {
  const Component = as || 'button';
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    ghost: 'hover:bg-gray-700 focus:ring-gray-600 text-gray-300',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
  };

  const sizeClasses = {
      normal: 'px-4 py-2 text-sm',
      icon: 'p-2'
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
}
