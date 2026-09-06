import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { officerId, password, role } = body;

    // Simple validation for prototype
    if (!officerId || !password || !role) {
      return NextResponse.json(
        { error: "Please enter Officer ID, Role, and Password." },
        { status: 400 }
      );
    }

    // Define default credentials mapping for each role
    const roleCredentials: Record<string, string> = {
      "ADMIN": "admin@123",
      "INSPECTOR": "inspector@123",
      "INVESTIGATOR": "investigator@123",
      "CONSTABLE": "constable@123"
    };

    const expectedPassword = roleCredentials[role.toUpperCase()];

    // Allow any credentials during the building phase, but enforce our prototype rules
    if (expectedPassword && password === expectedPassword) {
      // Generate a simple dummy session token matching the selected role
      const sessionData = { user: officerId, role: role.toUpperCase(), exp: Date.now() + 86400000 };
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

    return NextResponse.json(
      { error: "Invalid Official ID, Role, or Password. Access denied." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
