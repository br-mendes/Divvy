'use client';

import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ loading, disabled, variant = 'primary', className, children, ...props }: ButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-black text-white hover:opacity-90'
      : variant === 'secondary'
      ? 'border border-gray-300 text-gray-800 hover:bg-gray-50'
      : 'text-gray-800 hover:bg-gray-100';

  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition',
        styles,
        (disabled || loading) ? 'opacity-60 cursor-not-allowed' : '',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {loading ? 'Carregando…' : children}
    </button>
  );
}

export default Button;
