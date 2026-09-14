'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger/logger';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Error encountered in Dashboard feature', error, { digest: error.digest });
  }, [error]);

  return (
    <div
      className="container"
      style={{
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
        Unable to load Dashboard
      </h2>
      <p style={{ color: 'hsl(var(--text-muted))', maxWidth: '400px' }}>
        There was a problem fetching the orders domain data.
      </p>
      <Button variant="primary" onClick={() => reset()}>
        Retry Loading
      </Button>
    </div>
  );
}
