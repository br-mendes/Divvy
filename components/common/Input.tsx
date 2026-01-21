'use client';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      showPasswordToggle = false,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType =
      showPasswordToggle && type === 'password'
        ? (showPassword ? 'text' : 'password')
        : type;

    const errorId = `${id ?? props.name ?? 'input'}-error`;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required ? <span className="text-red-500"> *</span> : null}
          </label>
        )}

        <div className="relative">
          {icon ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={id}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={[
              'w-full rounded-md border px-3 py-2 text-sm outline-none',
              icon ? 'pl-10' : '',
              error
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 focus:ring-2 focus:ring-gray-200',
            ].join(' ')}
            {...props}
          />

          {showPasswordToggle && type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:underline"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          ) : null}
        </div>

        {(error || helperText) ? (
          <p
            id={errorId}
            className={['mt-1 text-xs', error ? 'text-red-600' : 'text-gray-500'].join(' ')}
          >
            {error || helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
