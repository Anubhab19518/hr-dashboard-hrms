import { describe, it, expect } from 'vitest';
import {
  calculateOrderTotal,
  isHighValueOrder,
  canApproveOrder,
  formatCurrency,
  HIGH_VALUE_ORDER_THRESHOLD,
} from '../utils/calculate-order-total';
import { OrderService } from '../services/order-service';

describe('Orders Feature Domain Rules (AGENTS.md Rule 40 & 41)', () => {
  it('should accurately calculate total amount across order items', () => {
    const items = [
      { quantity: 2, unitPrice: 150 },
      { quantity: 3, unitPrice: 300 },
    ];
    const total = calculateOrderTotal(items);
    expect(total).toBe(1200);
  });

  it('should correctly identify high value orders above threshold', () => {
    expect(HIGH_VALUE_ORDER_THRESHOLD).toBe(10_000);
    expect(isHighValueOrder(9_999)).toBe(false);
    expect(isHighValueOrder(10_000)).toBe(true);
    expect(isHighValueOrder(25_000)).toBe(true);
  });

  it('should enforce role-based authorization for order approvals', () => {
    // High-value orders can ONLY be approved by admin
    expect(canApproveOrder('admin', 15_000)).toBe(true);
    expect(canApproveOrder('manager', 15_000)).toBe(false);
    expect(canApproveOrder('viewer', 15_000)).toBe(false);

    // Standard orders can be approved by manager or admin
    expect(canApproveOrder('admin', 5_000)).toBe(true);
    expect(canApproveOrder('manager', 5_000)).toBe(true);
    expect(canApproveOrder('viewer', 5_000)).toBe(false);
  });

  it('should format currency with proper symbol and formatting', () => {
    const formatted = formatCurrency(1250);
    expect(formatted).toContain('1,250');
    expect(formatted).toContain('$');
  });

  it('should create and retrieve orders via OrderService', async () => {
    const initialOrders = await OrderService.listOrders();
    const countBefore = initialOrders.length;

    const created = await OrderService.createOrder({
      customerName: 'Test Corp',
      customerEmail: 'test@corp.com',
      items: [{ productName: 'Enterprise Node', quantity: 2, unitPrice: 1000 }],
    });

    expect(created.id).toBeDefined();
    expect(created.totalAmount).toBe(2000);
    expect(created.status).toBe('PENDING');

    const ordersAfter = await OrderService.listOrders();
    expect(ordersAfter.length).toBe(countBefore + 1);

    // Status transition
    const updated = await OrderService.updateStatus(created.id, 'CONFIRMED');
    expect(updated?.status).toBe('CONFIRMED');
  });
});
