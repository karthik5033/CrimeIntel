import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = {
      id: 'mock-user-id',
      email: 'admin@crimeintel.gov.in',
      first_name: 'Admin',
      last_name: 'User',
      role: 'Superintendent'
    };
    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
