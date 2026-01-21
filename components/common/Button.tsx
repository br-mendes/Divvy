'use client';

import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

const stylesByVariant: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-black text-white hover:opacity-90',
  secondary: 'border border-gray-300 text-gray-800 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:opacity-90',
  ghost: 'text-gray-800 hover:bg-gray-50',
};

export function Button({
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition',
        stylesByVariant[variant],
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
