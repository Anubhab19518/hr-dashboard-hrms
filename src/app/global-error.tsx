'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: 'hsl(var(--bg-primary, 224 71% 4%))',
          color: 'hsl(var(--text-primary, 210 40% 98%))',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-family-sans, sans-serif)',
        }}
      >
        <div style={{ textAlign: 'center', padding: 'var(--space-8, 2rem)' }}>
          <h1
            style={{
              fontSize: 'var(--font-size-3xl, 1.875rem)',
              marginBottom: 'var(--space-4, 1rem)',
            }}
          >
            Critical System Error
          </h1>
          <p
            style={{
              color: 'hsl(var(--text-secondary, 215 20% 70%))',
              marginBottom: 'var(--space-6, 1.5rem)',
            }}
          >
            A catastrophic application error occurred. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'hsl(var(--color-brand-accent, 246 83% 60%))',
              color: 'hsl(var(--text-primary, 210 40% 98%))',
              borderRadius: 'var(--radius-md, 0.5rem)',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
