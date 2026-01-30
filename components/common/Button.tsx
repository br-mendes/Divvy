'use client';

import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;

  // Back-compat: older call sites use these names.
  loading?: boolean;
  loadingText?: string;
};

const stylesByVariant: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-700',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
  outline:
    'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
};

const stylesBySize: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-6 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading,
    loading,
    loadingText,
    className = '',
    disabled,
    children,
    ...props
  },
  ref
) {
  const busy = Boolean(isLoading ?? loading);
  const isDisabled = disabled || busy;

  return (
    <button
      {...props}
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        'dark:focus:ring-offset-gray-900',
        stylesByVariant[variant],
        stylesBySize[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {busy ? (
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

<<<<<<< HEAD
export default Button;
=======
export default Button;
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
