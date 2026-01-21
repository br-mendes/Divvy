'use client';

import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
};

function variantClasses(variant: ButtonVariant) {
  switch (variant) {
    case 'secondary':
      return 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'ghost':
      return 'bg-transparent text-gray-900 hover:bg-gray-100';
    case 'primary':
    default:
      return 'bg-black text-white hover:bg-gray-900';
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, loadingText = 'Carregando…', className, disabled, children, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-gray-300',
        variantClasses(variant),
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className ?? '',
      ].join(' ')}
    >
      {loading ? loadingText : children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
