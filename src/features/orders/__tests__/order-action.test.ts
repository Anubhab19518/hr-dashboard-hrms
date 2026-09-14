import { describe, it, expect, vi } from 'vitest';
import { createOrderAction, updateOrderStatusAction } from '../actions/order.action';
import { OrderService } from '../services/order-service';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Orders Server Actions (AGENTS.md Rule 15)', () => {
  it('should validate and create new order', async () => {
    const result = await createOrderAction({
      customerName: 'Enterprise Client',
      customerEmail: 'billing@client.com',
      items: [{ productName: 'Enterprise Platform', quantity: 1, unitPrice: 5000 }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerName).toBe('Enterprise Client');
      expect(result.data.totalAmount).toBe(5000);
    }
  });

  it('should reject invalid input payload with field errors', async () => {
    const result = await createOrderAction({
      customerName: '',
      customerEmail: 'invalid-email',
      items: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
  });

  it('should catch and handle unexpected service errors gracefully', async () => {
    vi.spyOn(OrderService, 'createOrder').mockRejectedValueOnce(new Error('DB Timeout'));

    const result = await createOrderAction({
      customerName: 'Error Client',
      customerEmail: 'error@client.com',
      items: [{ productName: 'Service', quantity: 1, unitPrice: 100 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Could not create order');
    }
  });

  it('should update status of existing order', async () => {
    const created = await createOrderAction({
      customerName: 'Status Client',
      customerEmail: 'status@client.com',
      items: [{ productName: 'Service', quantity: 1, unitPrice: 300 }],
    });

    expect(created.success).toBe(true);
    if (created.success) {
      const updated = await updateOrderStatusAction({
        orderId: created.data.id,
        status: 'CONFIRMED',
      });

      expect(updated.success).toBe(true);
      if (updated.success) {
        expect(updated.data.status).toBe('CONFIRMED');
      }
    }
  });

  it('should reject invalid status update input', async () => {
    const res = await updateOrderStatusAction({ orderId: '', status: 'UNKNOWN' });
    expect(res.success).toBe(false);
  });

  it('should handle order not found during status update', async () => {
    const res = await updateOrderStatusAction({
      orderId: 'non_existent_id',
      status: 'CANCELLED',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Order not found');
    }
  });
});
