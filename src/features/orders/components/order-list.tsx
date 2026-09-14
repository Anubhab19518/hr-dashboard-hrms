'use client';

import { useState, useTransition } from 'react';
import type { Order, OrderStatus } from '../types/order.types';
import { formatCurrency, isHighValueOrder } from '../utils/calculate-order-total';
import { updateOrderStatusAction } from '../actions/order.action';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface OrderListProps {
  initialOrders: readonly Order[];
}

const statusBadgeMap: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<readonly Order[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setActiveOrderId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status: newStatus });
      if (result.success) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? result.data : order)));
      }
      setActiveOrderId(null);
    });
  };

  if (orders.length === 0) {
    return (
      <div
        style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'hsl(var(--text-muted))' }}
      >
        No orders found. Create a new order above.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {orders.map((order) => {
        const highValue = isHighValueOrder(order.totalAmount);
        const isUpdating = isPending && activeOrderId === order.id;

        return (
          <div
            key={order.id}
            className="glass-card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontWeight: 700,
                    fontSize: 'var(--font-size-base)',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {order.orderNumber}
                </span>
                <Badge variant={statusBadgeMap[order.status]}>{order.status}</Badge>
                {highValue && <Badge variant="warning">High Value</Badge>}
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(var(--text-secondary))' }}>
                Customer: <strong>{order.customerName}</strong> ({order.customerEmail})
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                Items: {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {formatCurrency(order.totalAmount)}
                </span>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              {order.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isUpdating}
                  onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                >
                  Confirm Order
                </Button>
              )}

              {order.status === 'CONFIRMED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={isUpdating}
                  onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                >
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
