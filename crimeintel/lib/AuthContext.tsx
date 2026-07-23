"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuditLogger } from "./api/auditLogger";

export type Role = "CONSTABLE" | "INSPECTOR" | "SUPERINTENDENT" | "ADMIN";

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  userId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("INSPECTOR");
  const [userId] = useState<string>("U10943"); // Mock user ID

  useEffect(() => {
    const savedRole = localStorage.getItem("crimeintel_role") as Role;
    if (savedRole && ["CONSTABLE", "INSPECTOR", "SUPERINTENDENT", "ADMIN"].includes(savedRole)) {
      setRoleState(savedRole);
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("crimeintel_role", newRole);
    AuditLogger.logEvent({
      event_type: "AUTH",
      user_id: userId,
      user_role: newRole,
      details: { action: "ROLE_CHANGED", previous_role: role, new_role: newRole }
    });
  };

  return (
    <AuthContext.Provider value={{ role, setRole, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
