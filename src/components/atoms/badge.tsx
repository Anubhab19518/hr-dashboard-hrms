import type { HTMLAttributes, CSSProperties } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, CSSProperties> = {
  default: {
    backgroundColor: 'hsl(var(--bg-surface-hover))',
    color: 'hsl(var(--text-secondary))',
    border: '1px solid hsl(var(--border-subtle))',
  },
  success: {
    backgroundColor: 'hsl(var(--color-success-bg))',
    color: 'hsl(var(--color-success))',
    border: '1px solid hsl(var(--color-success) / 0.3)',
  },
  warning: {
    backgroundColor: 'hsl(var(--color-warning-bg))',
    color: 'hsl(var(--color-warning))',
    border: '1px solid hsl(var(--color-warning) / 0.3)',
  },
  danger: {
    backgroundColor: 'hsl(var(--color-danger-bg))',
    color: 'hsl(var(--color-danger))',
    border: '1px solid hsl(var(--color-danger) / 0.3)',
  },
  info: {
    backgroundColor: 'hsl(var(--color-info-bg))',
    color: 'hsl(var(--color-info))',
    border: '1px solid hsl(var(--color-info) / 0.3)',
  },
};

export function Badge({ children, variant = 'default', style, ...props }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...badgeVariants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
