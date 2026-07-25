"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function PrintButton({ label = "Export PDF", variant = "default", className }: PrintButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // For local development without Catalyst SmartBrowz backend, fallback to native browser print
      setTimeout(() => {
        window.print();
        setIsExporting(false);
      }, 500);
    } catch (e) {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant={variant}
      className={className}
      disabled={isExporting}
      onClick={handleExport}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
