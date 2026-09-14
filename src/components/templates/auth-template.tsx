import type { ReactNode } from 'react';

export interface AuthTemplateProps {
  title: string;
  subtitle?: string;
  formSlot: ReactNode;
  footerSlot?: ReactNode;
}

/**
 * AuthTemplate
 *
 * Wireframe template providing continuous aesthetic framing for authentication & onboarding flows.
 * Positions a focused visual container with responsive bounds and subtle glassmorphic backdrop.
 */
export function AuthTemplate({ title, subtitle, formSlot, footerSlot }: AuthTemplateProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 180px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              marginBottom: 'var(--space-2)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-muted))',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div>{formSlot}</div>

        {footerSlot && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
            }}
          >
            {footerSlot}
          </div>
        )}
      </div>
    </div>
  );
}
