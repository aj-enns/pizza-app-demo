import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { User, UserProfile } from '@/lib/types';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, address, city, zipCode } = body;

    // Validate user ID
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Find user file
    const userPath = path.join(USERS_DIR, `${id}.json`);
    
    if (!existsSync(userPath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Read current user data
    const userData = await readFile(userPath, 'utf-8');
    const user: User = JSON.parse(userData);

    // Update only provided fields
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (zipCode !== undefined) user.zipCode = zipCode.trim();

    // Save updated user
    await writeFile(userPath, JSON.stringify(user, null, 2), { encoding: 'utf-8' });

    // Return updated profile (without password)
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
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}
