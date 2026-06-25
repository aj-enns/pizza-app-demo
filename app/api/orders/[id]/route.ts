import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Order } from '@/lib/types';
import { trackPerformance, PERFORMANCE_THRESHOLDS } from '@/lib/performance';
import { logger } from '@/lib/logger';

const DATA_DIR = path.join(process.cwd(), 'data', 'orders');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = request.headers.get('x-request-id') || randomUUID();
  return trackPerformance(
    'API:GET:/api/orders/[id]',
    async () => {
      try {
        const orderFilePath = path.join(DATA_DIR, `${id}.json`);

        if (!existsSync(orderFilePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404, headers: { 'x-request-id': requestId } }
      );
    }

    const orderData = await trackPerformance(
      'readOrderFile',
      async () => readFile(orderFilePath, 'utf-8'),
      PERFORMANCE_THRESHOLDS.FILE_OPERATION,
      { orderId: id, requestId }
    );
    const order: Order = JSON.parse(orderData);

    return NextResponse.json({
      success: true,
      data: order,
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    logger.error('Order retrieval failed', {
      requestId,
      orderId: id,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order',
      },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: `/api/orders/${id}`, orderId: id, requestId }
  );
}
