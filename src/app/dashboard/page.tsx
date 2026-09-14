import type { Metadata } from 'next';
import { OrderList, formatCurrency } from '@/features/orders';
import { OrderService } from '@/features/orders/server';
import { DashboardActions } from './dashboard-actions';

export const metadata: Metadata = {
  title: 'Enterprise Orders Dashboard',
  description: 'Manage production orders, approval workflows, and revenue metrics.',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const orders = await OrderService.listOrders();
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;

  return (
    <div
      className="container"
      style={{
        padding: 'var(--space-8) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
      }}
    >
      {/* Dashboard Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, margin: 0 }}>
            Enterprise Orders
          </h1>
          <p
            style={{
              color: 'hsl(var(--text-muted))',
              marginTop: 'var(--space-1)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Real-time domain data fetched server-side with optimistic client interactions.
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div className="glass-card">
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Total Pipeline
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              marginTop: 'var(--space-1)',
              color: 'hsl(var(--text-primary))',
            }}
          >
            {formatCurrency(totalRevenue)}
          </p>
        </div>

        <div className="glass-card">
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Pending Approval
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              marginTop: 'var(--space-1)',
              color: 'hsl(var(--color-warning))',
            }}
          >
            {pendingCount}
          </p>
        </div>

        <div className="glass-card">
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Confirmed Orders
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              marginTop: 'var(--space-1)',
              color: 'hsl(var(--color-info))',
            }}
          >
            {confirmedCount}
          </p>
        </div>
      </div>

      {/* Orders List Section */}
      <div>
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
          }}
        >
          Active Orders ({orders.length})
        </h2>
        <OrderList initialOrders={orders} />
      </div>
    </div>
  );
}
