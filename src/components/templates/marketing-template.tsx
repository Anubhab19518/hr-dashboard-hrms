import type { ReactNode } from 'react';

export interface MarketingTemplateProps {
  heroSlot: ReactNode;
  featuresSlot?: ReactNode;
  statsSlot?: ReactNode;
  ctaSlot?: ReactNode;
}

/**
 * MarketingTemplate
 *
 * Wireframe template orchestrating continuous UI rhythm for public/marketing screens.
 * Uses strict design tokens for section spacing, vertical rhythm, and responsive gutters.
 */
export function MarketingTemplate({
  heroSlot,
  featuresSlot,
  statsSlot,
  ctaSlot,
}: MarketingTemplateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100%',
        gap: 'var(--space-16)',
      }}
    >
      <section
        aria-label="Hero Section"
        style={{
          paddingTop: 'var(--space-16)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        <div className="container">{heroSlot}</div>
      </section>

      {statsSlot && (
        <section
          aria-label="Metrics and Statistics"
          style={{
            paddingTop: 'var(--space-8)',
            paddingBottom: 'var(--space-8)',
          }}
        >
          <div className="container">{statsSlot}</div>
        </section>
      )}

      {featuresSlot && (
        <section
          aria-label="Features and Architecture"
          style={{
            paddingTop: 'var(--space-8)',
            paddingBottom: 'var(--space-12)',
          }}
        >
          <div className="container">{featuresSlot}</div>
        </section>
      )}

      {ctaSlot && (
        <section
          aria-label="Call to Action"
          style={{
            paddingTop: 'var(--space-8)',
            paddingBottom: 'var(--space-16)',
          }}
        >
          <div className="container">{ctaSlot}</div>
        </section>
      )}
    </div>
  );
}
