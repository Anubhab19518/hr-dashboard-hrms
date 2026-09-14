import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const isGlass = variant === 'glass';
  return (
    <div
      style={{
        backgroundColor: isGlass ? 'hsl(var(--bg-surface) / 0.65)' : 'hsl(var(--bg-surface))',
        backdropFilter: isGlass ? 'blur(16px)' : undefined,
        border: '1px solid hsl(var(--border-subtle))',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: 'var(--space-6) var(--space-6) var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, style, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 600,
        color: 'hsl(var(--text-primary))',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        fontSize: 'var(--font-size-sm)',
        color: 'hsl(var(--text-secondary))',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: 'var(--space-3) var(--space-6) var(--space-6)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid hsl(var(--border-subtle))',
        backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--space-3)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
