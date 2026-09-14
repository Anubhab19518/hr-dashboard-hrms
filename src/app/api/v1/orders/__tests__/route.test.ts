import { describe, it, expect } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('Orders API Route Handlers (AGENTS.md Rule 11 & 43)', () => {
  it('should return list of orders via GET', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = (await res.json()) as { success: boolean; data: unknown[] };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should validate and create order via POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'API Customer',
        customerEmail: 'api@customer.com',
        items: [{ productName: 'API License', quantity: 1, unitPrice: 2500 }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = (await res.json()) as { success: boolean; data: { totalAmount: number } };
    expect(json.success).toBe(true);
    expect(json.data.totalAmount).toBe(2500);
  });

  it('should return 422 validation error on bad payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({ customerName: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);

    const json = (await res.json()) as { success: boolean; error: { code: string } };
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
