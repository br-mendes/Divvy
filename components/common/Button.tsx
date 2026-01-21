'use client';

import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
};

const stylesByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-black text-white hover:bg-gray-900',
  secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-900 hover:bg-gray-100',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, loadingText, className = '', disabled, children, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-gray-300',
        stylesByVariant[variant],
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ].join(' ')}
    >
      {loading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadingText ? <span>{loadingText}</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
