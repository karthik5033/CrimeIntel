"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuditLogger } from "./api/auditLogger";
import { CatalystUser } from "./catalyst/auth";

export type Role = "CONSTABLE" | "INSPECTOR" | "SUPERINTENDENT" | "ADMIN";

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  userId: string;
  user: CatalystUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("INSPECTOR");
  const [userId, setUserId] = useState<string>("U10943");
  const [user, setUser] = useState<CatalystUser | null>(null);

  useEffect(() => {
    // Hydrate from Catalyst Authentication API Route
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(catalystUser => {
        if (catalystUser && !catalystUser.error) {
          setUser(catalystUser);
          setUserId(catalystUser.id);
          
          const savedRole = localStorage.getItem("crimeintel_role") as Role;
          if (savedRole && ["CONSTABLE", "INSPECTOR", "SUPERINTENDENT", "ADMIN"].includes(savedRole)) {
            setRoleState(savedRole);
          } else if (catalystUser.role) {
            setRoleState(catalystUser.role);
          }
        }
      })
      .catch(err => console.error("Failed to fetch auth state:", err));
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("crimeintel_role", newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
    AuditLogger.logEvent({
      event_type: "AUTH",
      user_id: userId,
      user_role: newRole,
      details: { action: "ROLE_CHANGED", previous_role: role, new_role: newRole }
    });
  };

  return (
    <AuthContext.Provider value={{ role, setRole, userId, user }}>
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
