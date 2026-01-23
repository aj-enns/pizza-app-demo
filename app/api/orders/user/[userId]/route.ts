import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Order } from '@/lib/types';

const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Check if orders directory exists
    if (!existsSync(ORDERS_DIR)) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Read all order files
    const files = await readdir(ORDERS_DIR);
    const userOrders: Order[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const orderPath = path.join(ORDERS_DIR, file);
        const orderData = await readFile(orderPath, 'utf-8');
        const order: Order = JSON.parse(orderData);
        
        // Filter orders by userId
        if (order.userId === userId) {
          userOrders.push(order);
        }
      }
    }

    // Sort orders by creation date (newest first)
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: userOrders,
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user orders',
      },
      { status: 500 }
    );
  }
}
