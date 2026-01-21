'use client';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', label, ...props },
  ref
) {
  return (
    <label className={'block ' + (label ? 'space-y-1 ' : '')}>
      {label ? <span className='text-sm text-gray-600'>{label}</span> : null}
      <input
        ref={ref}
        className={
          'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ' +
          'focus:ring-2 focus:ring-black/10 focus:border-gray-400 ' +
          className
        }
        {...props}
      />
    </label>
  );
});

export default Input;