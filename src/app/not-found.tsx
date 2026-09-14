import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
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
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: 'var(--font-size-5xl)',
          fontWeight: 800,
          color: 'hsl(var(--color-brand-accent))',
        }}
      >
        404
      </span>
      <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>Page Not Found</h1>
      <p
        style={{
          color: 'hsl(var(--text-muted))',
          maxWidth: '460px',
          fontSize: 'var(--font-size-base)',
        }}
      >
        The requested resource does not exist or has been moved to another architectural boundary.
      </p>
      <Link href="/">
        <Button variant="primary" size="md">
          Return to Dashboard / Home
        </Button>
      </Link>
    </div>
  );
}
