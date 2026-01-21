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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon,
    showPasswordToggle = false,
    type = 'text',
    className = '',
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle && showPassword ? 'text' : type;
    const hasError = !!error;

    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && (
          <label className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            type={inputType}
            className={`${styles.input} ${hasError ? styles.error : ''} ${icon ? styles.withIcon : ''}`}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '' : ''} 
            </button>
          )}
        </div>
        {(error || helperText) && (
          <div
            className={`${styles.helperText} ${error ? styles.errorText : ''}`}
            id={`${props.id}-error`}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
