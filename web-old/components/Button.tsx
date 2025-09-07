import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'neutral' | 'danger';
  isLoading?: boolean;
};

export default function Button({
  className,
  variant = 'primary',
  isLoading,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn btn-primary'
      : variant === 'danger'
        ? 'btn btn-danger'
        : 'btn btn-neutral';

  return (
    <button
      className={[variantClass, className].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
