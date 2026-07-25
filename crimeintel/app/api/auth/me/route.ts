import { NextResponse } from 'next/server';
import { CatalystAuth } from '@/lib/catalyst/auth';

export async function GET(request: Request) {
  try {
    const user = await CatalystAuth.getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
