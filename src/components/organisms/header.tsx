import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        width: '100%',
        borderBottom: '1px solid hsl(var(--border-subtle))',
        backgroundColor: 'hsl(var(--bg-primary) / 0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          height: '64px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontWeight: 700,
              fontSize: 'var(--font-size-base)',
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-md)',
                background:
                  'linear-gradient(135deg, hsl(var(--color-brand-accent)), hsl(var(--color-brand-accent-hover)))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--text-inverse))',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 800,
              }}
            >
              HR
            </span>
            <span className="gradient-text">{siteConfig.name}</span>
          </Link>

          <nav
            aria-label="Main Navigation"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}
          >
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-secondary))',
                  fontWeight: 500,
                  transition: 'color var(--transition-fast)',
                }}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link
            href="/login"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'hsl(var(--text-inverse))',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-brand-accent))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
