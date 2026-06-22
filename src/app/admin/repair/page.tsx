"use client";
export const dynamic = "force-dynamic";
// TEMP: src/app/admin/repair/page.tsx — delete after use
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

export default function AdminRepairPage() {
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState<any>(null);

  async function runRepair() {
    setRunning(true);
    setResult(null);
    try {
      const res  = await fetch("/api/debug/repair-orphaned-qc", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Repaired ${data.repaired} chapter(s).`);
      } else {
        toast.error(data.error || "Failed to repair.");
      }
    } catch (e) {
      toast.error("Something went wrong.");
    }
    setRunning(false);
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" }}>
          🔧 Repair Orphaned QC Chapters
        </h1>
        <p style={{ fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 }}>
          This finds all chapters stuck in QC review with no QC staff assigned (routedToQcId is null)
          and assigns them to whichever QC has the fewest active jobs right now.
        </p>

        <button
          onClick={runRepair}
          disabled={running}
          style={{
            padding: ".85rem 1.5rem", borderRadius: "12px", border: "none",
            background: running ? "#94A3B8" : "#0C1A2E", color: "#38BDF8",
            fontSize: ".88rem", fontWeight: 700, cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Repairing..." : "▶ Run Repair Now"}
        </button>

        {result && (
          <div style={{ marginTop: "1.5rem", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"12px", padding:"1.25rem" }}>
            <p style={{ fontWeight: 700, color: "#166534", marginBottom: ".75rem" }}>
              ✅ Repaired {result.repaired} chapter(s)
            </p>
            {result.results?.map((r: any, i: number) => (
              <div key={i} style={{ fontSize: ".78rem", color: "#15803D", marginBottom: ".4rem", paddingBottom: ".4rem", borderBottom: i < result.results.length - 1 ? "1px solid #DCFCE7" : "none" }}>
                <strong>{r.topic}</strong> → assigned to <strong>{r.assignedTo}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
