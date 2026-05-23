"use client";

export async function exportToExcel(type: string, filters?: Record<string, unknown>) {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...filters }),
  });

  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    res.headers
      .get("Content-Disposition")
      ?.split("filename=")[1]
      ?.replace(/"/g, "") || `kreston_${type}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
