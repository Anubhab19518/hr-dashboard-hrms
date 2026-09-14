export default function DashboardLoading() {
  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <div
        style={{
          height: '48px',
          width: '280px',
          backgroundColor: 'hsl(var(--bg-surface))',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-8)',
          animation: 'pulse 1.5s infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '96px',
              backgroundColor: 'hsl(var(--bg-surface) / 0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border-subtle))',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    </div>
  );
}
