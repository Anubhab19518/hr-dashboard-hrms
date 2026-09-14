import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderList } from '../order-list';
import type { Order } from '../../types/order.types';

vi.mock('../../actions/order.action', () => ({
  updateOrderStatusAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'ord-1',
      orderNumber: 'ORD-2026-001',
      customerName: 'Alice',
      customerEmail: 'alice@test.com',
      items: [{ id: '1', productName: 'Item', quantity: 1, unitPrice: 100 }],
      totalAmount: 100,
      status: 'CONFIRMED',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  }),
}));

describe('OrderList Component (AGENTS.md Rule 19)', () => {
  const sampleOrders: Order[] = [
    {
      id: 'ord-1',
      orderNumber: 'ORD-2026-001',
      customerName: 'Alice',
      customerEmail: 'alice@test.com',
      items: [{ id: '1', productName: 'Cloud License', quantity: 1, unitPrice: 500 }],
      totalAmount: 500,
      status: 'PENDING',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  it('should render orders and trigger status change', () => {
    render(<OrderList initialOrders={sampleOrders} />);

    expect(screen.getByText('ORD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm order/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm order/i }));
  });

  it('should render empty state when no orders provided', () => {
    render(<OrderList initialOrders={[]} />);
    expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
  });
});
