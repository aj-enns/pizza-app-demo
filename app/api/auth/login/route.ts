import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { User, UserProfile, LoginCredentials } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Find user by email
    if (!existsSync(USERS_DIR)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    const files = await readdir(USERS_DIR);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const userPath = path.join(USERS_DIR, file);
        const userData = await readFile(userPath, 'utf-8');
        const user: User = JSON.parse(userData);
        
        if (user.email.toLowerCase() === email.toLowerCase().trim()) {
          // Verify password using bcrypt
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (isPasswordValid) {
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
          }
          
          // Wrong password
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid email or password',
            },
            { status: 401 }
          );
        }
      }
    }

    // User not found
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid email or password',
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to login',
      },
      { status: 500 }
    );
  }
}
