import type { ReactNode } from 'react';

export interface DashboardShellTemplateProps {
  sidebarSlot: ReactNode;
  topbarSlot?: ReactNode;
  contentSlot: ReactNode;
}

/**
 * DashboardShellTemplate
 *
 * Structural shell for the authenticated dashboard area.
 * Positions the sidebar and main content area with proper transitions
 * for collapse/expand behavior.
 */
export function DashboardShellTemplate({
  sidebarSlot,
  topbarSlot,
  contentSlot,
}: DashboardShellTemplateProps) {
  return (
    <div className="dashboard-shell">
      {sidebarSlot}
      <div className="dashboard-main">
        {topbarSlot}
        <div className="dashboard-content">{contentSlot}</div>
      </div>
    </div>
  );
}
