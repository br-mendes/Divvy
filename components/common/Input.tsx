// components/common/Input.tsx

import React, { useState } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-dark mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

    const inputType = showPasswordToggle && showPassword ? 'text' : type;
    const hasError = !!error;

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default Input;
