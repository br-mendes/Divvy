'use client';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const describedBy = error ? `${id ?? 'input'}-error` : undefined;

    return (
      <div className={className ?? ''}>
        {label ? (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
            {props.required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}

        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm outline-none',
            error ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-gray-200',
          ].join(' ')}
          {...props}
        />

        {error || helperText ? (
          <div id={describedBy} className={['mt-1 text-xs', error ? 'text-red-600' : 'text-gray-500'].join(' ')}>
            {error || helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
