'use client';

import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
};

export function Button({
  className = '',
  loading = false,
  variant = 'primary',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ' +
    'disabled:opacity-60 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-black text-white hover:opacity-90',
    secondary: 'border border-gray-300 text-gray-800 hover:bg-gray-50',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
    ghost: 'text-gray-800 hover:bg-gray-100',
  };

  return (
    <button
      className={[base, variants[variant], className].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
}

export default Button;
