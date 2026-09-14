export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  readonly id: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly items: readonly OrderItem[];
  readonly totalAmount: number;
  readonly status: OrderStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type OrderActionResult<T> =
  | { readonly success: true; readonly data: T }
  | {
      readonly success: false;
      readonly error: string;
      readonly fieldErrors?: Record<string, string[]>;
    };
