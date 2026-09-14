'use server';

import { revalidatePath } from 'next/cache';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/order.schema';
import { OrderService } from '../services/order-service';
import type { Order, OrderActionResult } from '../types/order.types';
import { logger } from '@/lib/logger/logger';

export async function createOrderAction(formData: unknown): Promise<OrderActionResult<Order>> {
  const result = createOrderSchema.safeParse(formData);

  if (!result.success) {
    logger.warn('Create order validation failed', {
      fieldErrors: result.error.flatten().fieldErrors,
    });
    return {
      success: false,
      error: 'Validation failed for order submission',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const order = await OrderService.createOrder(result.data);
    revalidatePath('/dashboard');
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    logger.error('Failed to create order', error);
    return {
      success: false,
      error: 'Could not create order. Please try again later.',
    };
  }
}

export async function updateOrderStatusAction(input: unknown): Promise<OrderActionResult<Order>> {
  const result = updateOrderStatusSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: 'Invalid order status update parameters',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = await OrderService.updateStatus(result.data.orderId, result.data.status);
    if (!updated) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    logger.error('Failed to update order status', error);
    return {
      success: false,
      error: 'Failed to update status',
    };
  }
}
