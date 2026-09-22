import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, helperText, leftIcon, style, disabled, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '100%' }}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'hsl(var(--text-secondary))',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: 'hsl(var(--text-muted))',
                zIndex: 1,
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            style={{
              width: '100%',
              padding: leftIcon
                ? 'var(--space-2) var(--space-3) var(--space-2) 36px'
                : 'var(--space-2) var(--space-3)',
              fontSize: 'var(--font-size-sm)',
              backgroundColor: 'hsl(var(--bg-secondary))',
              color: 'hsl(var(--text-primary))',
              border: error
                ? '1px solid hsl(var(--color-danger))'
                : '1px solid hsl(var(--border-subtle))',
              borderRadius: 'var(--radius-md)',
              transition: 'border-color var(--transition-fast)',
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'text',
              ...style,
            }}
            {...props}
          />
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--color-danger))',
              marginTop: 'var(--space-1)',
            }}
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={helperId}
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              marginTop: 'var(--space-1)',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
