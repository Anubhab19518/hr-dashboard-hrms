'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger/logger';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Unhandled UI exception in root ErrorBoundary', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        minHeight: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'hsl(var(--color-danger-bg))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--color-danger))',
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
        }}
      >
        !
      </div>
      <h2
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          color: 'hsl(var(--text-primary))',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: 'hsl(var(--text-muted))',
          maxWidth: '480px',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        An unexpected error occurred while processing your request. The engineering team has been
        notified.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="primary" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
