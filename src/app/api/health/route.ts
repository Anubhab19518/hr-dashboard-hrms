import { NextResponse } from 'next/server';
import { getRequestId } from '@/lib/api/correlation';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const requestId = await getRequestId();
  const uptimeSeconds = process.uptime();

  const healthData = {
    status: 'healthy',
    checks: {
      liveness: 'UP',
      readiness: 'UP',
    },
    system: {
      uptimeSeconds: Math.floor(uptimeSeconds),
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(
    {
      success: true,
      data: healthData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    {
      status: 200,
      headers: {
        'x-request-id': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}
