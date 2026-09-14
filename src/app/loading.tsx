export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid hsl(var(--border-subtle))',
          borderTopColor: 'hsl(var(--color-brand-accent))',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-muted))' }}>
        Loading application...
      </p>
    </div>
  );
}
