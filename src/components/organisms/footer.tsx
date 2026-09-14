import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid hsl(var(--border-subtle))',
        backgroundColor: 'hsl(var(--bg-secondary))',
        padding: 'var(--space-8) 0',
        marginTop: 'auto',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
          &copy; {new Date().getFullYear()} {siteConfig.name}. Built according to AGENTS.md
          standards.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--color-success))',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'hsl(var(--color-success))',
              }}
            />
            All Systems Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
