"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const officerId = formData.get("officerId") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  // Simple validation for prototype
  if (!officerId || !password || !role) {
    return { error: "Please enter Officer ID, Role, and Password." };
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
    const token = btoa(JSON.stringify({ user: officerId, role: role.toUpperCase(), exp: Date.now() + 86400000 }));
    
    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("crimeintel_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    
    // Redirect to the dashboard command center
    redirect("/dashboard");
  }

  return { error: "Invalid Official ID, Role, or Password. Access denied." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("crimeintel_session");
  redirect("/login");
}
