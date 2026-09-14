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
          backgroundColor: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Critical System Error</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            A catastrophic application error occurred. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              borderRadius: '0.5rem',
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
