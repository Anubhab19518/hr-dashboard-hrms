import { NextRequest } from 'next/server';
import { getRequestId } from '@/lib/api/correlation';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response';
import { createOrderSchema } from '@/features/orders';
import { OrderService } from '@/features/orders/server';
import { logger } from '@/lib/logger/logger';

export async function GET(): Promise<Response> {
  const requestId = await getRequestId();
  try {
    const orders = await OrderService.listOrders();
    return createSuccessResponse(orders, requestId);
  } catch (error) {
    logger.error('Failed to fetch orders via REST API', error, { requestId });
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'Could not retrieve orders',
      requestId,
      500,
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = await getRequestId();
  try {
    const rawBody = (await request.json()) as unknown;
    const parseResult = createOrderSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Payload validation failed',
        requestId,
        422,
        parseResult.error.flatten().fieldErrors,
      );
    }

    const createdOrder = await OrderService.createOrder(parseResult.data);
    return createSuccessResponse(createdOrder, requestId, 201);
  } catch (error) {
    logger.error('Failed to process order creation', error, { requestId });
    return createErrorResponse('BAD_REQUEST', 'Unable to process order request', requestId, 400);
  }
}
