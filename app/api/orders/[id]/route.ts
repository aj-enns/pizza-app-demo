import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Order } from '@/lib/types';
import { trackPerformance, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

const DATA_DIR = path.join(process.cwd(), 'data', 'orders');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return trackPerformance(
    'API:GET:/api/orders/[id]',
    async () => {
      try {
        const { id } = await params;
        const orderFilePath = path.join(DATA_DIR, `${id}.json`);

        if (!existsSync(orderFilePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    const orderData = await trackPerformance(
      'readOrderFile',
      async () => readFile(orderFilePath, 'utf-8'),
      PERFORMANCE_THRESHOLDS.FILE_OPERATION,
      { orderId: id }
    );
    const order: Order = JSON.parse(orderData);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Order retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order',
      },
      { status: 500 }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: `/api/orders/[id]` }
  );
}
