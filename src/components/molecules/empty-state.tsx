import type { ReactNode } from 'react';
import { Button } from '@/components/atoms/button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed hsl(var(--border-subtle))',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'hsl(var(--bg-surface) / 0.3)',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: 'var(--font-size-4xl)',
            marginBottom: 'var(--space-3)',
            color: 'hsl(var(--text-muted))',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: 'hsl(var(--text-primary))',
          marginBottom: 'var(--space-1)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'hsl(var(--text-muted))',
          maxWidth: '400px',
          marginBottom: actionLabel && onAction ? 'var(--space-5)' : 0,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
