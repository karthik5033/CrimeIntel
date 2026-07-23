"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { CatalystSmartBrowz } from "@/lib/catalyst/smartbrowz";

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
      const htmlContent = document.documentElement.outerHTML;
      const pdfBuffer = await CatalystSmartBrowz.generatePdf(htmlContent, "CrimeIntel Investigation Report");
      
      if (pdfBuffer) {
        const uint8Array = new Uint8Array(pdfBuffer);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CrimeIntel_Report_${Date.now()}.pdf`;
        a.click();
      } else {
        window.print();
      }
    } catch (e) {
      window.print();
    } finally {
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
