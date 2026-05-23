"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export";

interface ExportButtonProps {
  type: string;
  filters?: Record<string, unknown>;
  label?: string;
  className?: string;
}

export function ExportButton({
  type,
  filters,
  label = "Export",
  className,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  async function handleExport() {
    setLoading(true);
    try {
      await exportToExcel(type, filters);
      setToast({ message: "Excel exported successfully", isError: false });
    } catch {
      setToast({ message: "Export failed", isError: true });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={loading}
        className={`gap-2 ${className || ""}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {label}
      </Button>
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 text-white text-sm font-medium ${
            toast.isError ? "bg-red-600" : "bg-brand-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
