// src/components/UI/Button.tsx
import React, { type FC } from 'react';
import type { ButtonProps, Size } from '../../types';

const Button: FC<ButtonProps> = ({
  appearance = 'solid',
  tone = 'brand',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'ws-btn ws-focus-ring';

  const sizeClasses: Record<Size, string> = {
    xs: 'ws-btn-xs',
    sm: 'ws-btn-sm',
    md: 'ws-btn-md',
    lg: 'ws-btn-lg',
  };

  const appearanceClasses: Record<string, string> = {
    outline: 'ws-btn-outline',
    soft: 'ws-btn-soft',
    solid: 'ws-btn-solid',
  };
  const appearanceClass = appearanceClasses[appearance] || 'ws-btn-solid';

  const toneClasses: Record<string, string> = {
    success: 'ws-success',
    warning: 'ws-warning',
    danger: 'ws-danger',
    info: 'ws-info',
    brand: '',
  };
  const toneClass = toneClasses[tone] || '';

  const finalClass = [
    base,
    sizeClasses[size],
    appearanceClass,
    toneClass,
    fullWidth && 'w-full',
    loading && 'pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={finalClass}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && iconPosition === 'left' && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}

      {!loading && icon && iconPosition === 'left' && icon}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}

      {loading && iconPosition === 'right' && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </button>
  );
};

export default Button;
