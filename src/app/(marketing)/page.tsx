import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MarketingPage() {
  const architecturalFeatures = [
    {
      title: 'Type Safety Over Convenience',
      description:
        'TypeScript strict mode with zero any, no @ts-ignore shortcuts, runtime boundary validation via Zod schemas.',
      badge: 'Rule 1, 10, 11',
    },
    {
      title: 'Strict Architectural Boundaries',
      description:
        'Layered unidirectional dependencies: App Router → Feature → Domain Service → Infrastructure. Automated ESLint boundary enforcement.',
      badge: 'Rule 4, 5, 6',
    },
    {
      title: 'Server by Default',
      description:
        'React Server Components by default. Smallest possible interactive subtrees isolated behind client boundaries. Server secrets never leaked.',
      badge: 'Rule 2, 8, 9',
    },
    {
      title: 'Reproducible Docker Containerization',
      description:
        'Multi-stage Docker builds pinned to Node 22 LTS Alpine with non-root security, pnpm lockfile, and integrated health checks.',
      badge: 'Rule 49, 50, 53',
    },
    {
      title: 'Zero Console.log in Production',
      description:
        'Centralized structured JSON logger with request correlation (x-request-id) and automatic sensitive data scrubbing.',
      badge: 'Rule 25, 26, 77',
    },
    {
      title: 'Testing & Coverage Benchmark',
      description:
        'Vitest integration and unit tests with enforced 80% coverage threshold, plus Playwright smoke test suites.',
      badge: 'Rule 44, 45, 46',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-16)',
        paddingBottom: 'var(--space-16)',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: 'var(--space-16) 0 var(--space-10)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '350px',
            background:
              'radial-gradient(circle, hsl(var(--color-brand-accent) / 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        <div
          className="container"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Badge variant="info">Next.js 16.3 • React 19.2 • Production Ready</Badge>
          </div>

          <h1
            className="gradient-text"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '900px',
              marginBottom: 'var(--space-6)',
            }}
          >
            Scalable, Resilient Next.js Frontend Template
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: 'hsl(var(--text-secondary))',
              maxWidth: '720px',
              lineHeight: 1.6,
              marginBottom: 'var(--space-8)',
            }}
          >
            Engineered strictly to the 80 production rules in <code>AGENTS.md</code>. Featuring
            compile-time boundary enforcement, containerization, and zero-compromise architecture.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              justifyContent: 'center',
            }}
          >
            <Link href="/dashboard">
              <Button size="lg" variant="primary">
                Explore Live Dashboard →
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Authentication Demo
              </Button>
            </Link>
            <a href="/api/health" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                Health Probe API
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Architectural Pillars Grid */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <h2
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 700,
              marginBottom: 'var(--space-2)',
            }}
          >
            Strict Architectural Pillars
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: 'var(--font-size-base)' }}>
            Every component, rule, and dependency is justified and enforced.
          </p>
        </div>

        <div className="grid-features">
          {architecturalFeatures.map((feat) => (
            <Card key={feat.title} variant="glass">
              <CardHeader>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Badge variant="default">{feat.badge}</Badge>
                </div>
                <CardTitle style={{ marginTop: 'var(--space-2)' }}>{feat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ lineHeight: 1.6 }}>{feat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Baseline Specs */}
      <section className="container">
        <div
          className="glass-panel"
          style={{
            padding: 'var(--space-8)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-6)',
            textAlign: 'center',
          }}
        >
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: 'hsl(var(--color-brand-accent))',
              }}
            >
              100%
            </span>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-secondary))',
                marginTop: '4px',
              }}
            >
              TypeScript Strict Mode
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: 'hsl(var(--color-success))',
              }}
            >
              ≥ 80%
            </span>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-secondary))',
                marginTop: '4px',
              }}
            >
              Test Coverage Benchmark
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 800,
                color: 'hsl(var(--color-info))',
              }}
            >
              Docker
            </span>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-secondary))',
                marginTop: '4px',
              }}
            >
              Node 22 LTS Multi-Stage
            </p>
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: '#ec4899' }}>
              80 Rules
            </span>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'hsl(var(--text-secondary))',
                marginTop: '4px',
              }}
            >
              AGENTS.md Compliant
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
