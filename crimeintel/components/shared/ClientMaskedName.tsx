"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { maskName } from "@/lib/utils/dataMasking";

export function ClientMaskedName({ name }: { name: string }) {
  const { role } = useAuth();
  return <span>{maskName(name, role)}</span>;
}
