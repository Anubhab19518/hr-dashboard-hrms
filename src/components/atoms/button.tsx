import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: 'hsl(var(--color-brand-accent))',
    color: 'hsl(var(--text-inverse))',
    border: '1px solid transparent',
    boxShadow: 'var(--shadow-sm)',
  },
  secondary: {
    backgroundColor: 'hsl(var(--bg-surface))',
    color: 'hsl(var(--text-primary))',
    border: '1px solid hsl(var(--border-subtle))',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'hsl(var(--text-primary))',
    border: '1px solid hsl(var(--border-subtle))',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'hsl(var(--text-secondary))',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'hsl(var(--color-danger))',
    color: 'hsl(var(--text-inverse))',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: 'var(--space-1) var(--space-3)',
    fontSize: 'var(--font-size-xs)',
    borderRadius: 'var(--radius-sm)',
    gap: 'var(--space-2)',
  },
  md: {
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-size-sm)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--space-2)',
  },
  lg: {
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--font-size-base)',
    borderRadius: 'var(--radius-lg)',
    gap: 'var(--space-3)',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.6 : 1,
          transition:
            'background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast)',
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        {...props}
      >
        {isLoading && (
          <span
            aria-hidden="true"
            style={{
              width: '1em',
              height: '1em',
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: 'var(--radius-full)',
              display: 'inline-block',
              animation: 'spin 0.75s linear infinite',
            }}
          />
        )}
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
