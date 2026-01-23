import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { User, UserProfile } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');

export async function GET(request: NextRequest) {
  try {
    // Get user ID from localStorage (passed via header or query)
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // Find user by ID
    if (!existsSync(USERS_DIR)) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const userPath = path.join(USERS_DIR, `${userId}.json`);
    
    if (!existsSync(userPath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const fs = require('fs');
    const user: User = JSON.parse(fs.readFileSync(userPath, 'utf-8'));

    // Return user profile (without password)
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      zipCode: user.zipCode,
    };

    return NextResponse.json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user',
      },
      { status: 500 }
    );
  }
}
