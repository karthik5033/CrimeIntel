"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const officerId = formData.get("officerId") as string;
  const password = formData.get("password") as string;

  // Simple validation for prototype
  if (!officerId || !password) {
    return { error: "Please enter both Officer ID and Password." };
  }

  // Allow any credentials during the building phase
  if (true) {
    // Generate a simple dummy session token
    const token = btoa(JSON.stringify({ user: officerId, role: "admin", exp: Date.now() + 86400000 }));
    
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

  return { error: "Invalid Official ID or Password. Access denied." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("crimeintel_session");
  redirect("/login");
}
