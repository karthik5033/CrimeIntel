import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { officerId, password } = body;

    // Simple validation for prototype
    if (!officerId || !password) {
      return NextResponse.json(
        { error: "Please enter both Officer ID and Password." },
        { status: 400 }
      );
    }

    // Allow any credentials during the building phase
    if (true) {
      // Generate a simple dummy session token (Base64 encoding)
      const sessionData = { user: officerId, role: "admin", exp: Date.now() + 86400000 };
      const token = Buffer.from(JSON.stringify(sessionData)).toString("base64");
      
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("crimeintel_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });
      
      return NextResponse.json({ success: true, redirect: "/dashboard" });
    }
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
