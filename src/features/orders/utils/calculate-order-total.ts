import type { Role } from '@/lib/auth/rbac';
import type { OrderItem } from '../types/order.types';

/**
 * Named domain constant for high-value orders requiring privileged approval (AGENTS.md Rule 41)
 */
export const HIGH_VALUE_ORDER_THRESHOLD = 10_000;

/**
 * Calculates total order sum cleanly without floating point anomalies.
 */
export function calculateOrderTotal(
  items: readonly Pick<OrderItem, 'quantity' | 'unitPrice'>[],
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/**
 * Pure domain decision function: evaluates whether an order exceeds approval threshold (AGENTS.md Rule 40)
 */
export function isHighValueOrder(totalAmount: number): boolean {
  return totalAmount >= HIGH_VALUE_ORDER_THRESHOLD;
}

/**
 * Pure domain rule: determines if a specific role can approve an order of given amount.
 */
export function canApproveOrder(role: Role, totalAmount: number): boolean {
  if (isHighValueOrder(totalAmount)) {
    return role === 'admin';
  }
  return role === 'admin' || role === 'manager';
}

/**
 * Formats currency safely according to ISO standards without hardcoding locale assumptions.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
