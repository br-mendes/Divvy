'use client';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    error,
    helperText,
    icon,
    showPasswordToggle = false,
    type = 'text',
    className = '',
    required,
    disabled,
    ...props
  },
  ref
) {
  const autoId = React.useId();
  const safeAutoId = String(autoId).replace(/[:]/g, '');
  const resolvedId = id ?? (label ? `input-${safeAutoId}` : undefined);

  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = Boolean(error);
  const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const describedBy =
    hasError && resolvedId ? `${resolvedId}-error` : helperText && resolvedId ? `${resolvedId}-help` : undefined;

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      {label ? (
        <label htmlFor={resolvedId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            {icon}
          </span>
        ) : null}

        <input
          {...props}
          ref={ref}
          id={resolvedId}
          type={inputType}
          required={required}
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'block w-full rounded-md border px-3 py-2 text-sm outline-none transition',
            'focus:ring-2 focus:ring-gray-300',
            icon ? 'pl-10' : '',
            showPasswordToggle && type === 'password' ? 'pr-12' : '',
            hasError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300',
            disabled ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white text-gray-900',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {showPasswordToggle && type === 'password' ? (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-600 hover:text-gray-900"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>

      {hasError ? (
        <p id={resolvedId ? `${resolvedId}-error` : undefined} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={resolvedId ? `${resolvedId}-help` : undefined} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
