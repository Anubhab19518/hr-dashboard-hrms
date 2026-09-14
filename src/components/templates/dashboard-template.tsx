import type { ReactNode } from 'react';

export interface DashboardTemplateProps {
  headerSlot: ReactNode;
  actionsSlot?: ReactNode;
  statsSlot?: ReactNode;
  contentSlot: ReactNode;
}

/**
 * DashboardTemplate
 *
 * Wireframe template providing a continuous, scalable layout grid for internal application views.
 * Establishes consistent horizontal/vertical rhythm, breadcrumb/header alignment, and content containment.
 */
export function DashboardTemplate({
  headerSlot,
  actionsSlot,
  statsSlot,
  contentSlot,
}: DashboardTemplateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-16)',
        width: '100%',
      }}
    >
      <div className="container">
        {/* Top Header & Context Actions Row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>{headerSlot}</div>
          {actionsSlot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {actionsSlot}
            </div>
          )}
        </div>

        {/* Key Metrics / KPI Summary Row */}
        {statsSlot && <div style={{ marginBottom: 'var(--space-8)' }}>{statsSlot}</div>}

        {/* Main Operational Domain Content */}
        <div>{contentSlot}</div>
      </div>
    </div>
  );
}
