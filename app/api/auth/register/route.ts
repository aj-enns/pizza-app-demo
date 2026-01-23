import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { User, UserProfile, RegisterCredentials } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');

// Simple hash function for demo purposes (NOT for production!)
// In production, use bcrypt or similar
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json();
    const { email, password, name, phone, address, city, zipCode } = body;

    // Validate required fields
    if (!email?.trim() || !password?.trim() || !name?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !zipCode?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate password length (minimum 6 characters for demo)
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (existsSync(USERS_DIR)) {
      const files = await readdir(USERS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const userPath = path.join(USERS_DIR, file);
          const fs = require('fs');
          const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
          if (userData.email.toLowerCase() === email.toLowerCase()) {
            return NextResponse.json(
              {
                success: false,
                error: 'Email already registered',
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Create user
    const userId = `user-${randomUUID()}`;
    const user: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      password: simpleHash(password), // Hash password
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      zipCode: zipCode.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save user to file
    const userFilePath = path.join(USERS_DIR, `${userId}.json`);
    await writeFile(userFilePath, JSON.stringify(user, null, 2), { encoding: 'utf-8' });

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
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register user',
      },
      { status: 500 }
    );
  }
}
