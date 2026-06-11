"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const DEG:Record<string,string>={OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem 1.25rem", marginBottom:".6rem", display:"flex", alignItems:"center", gap:"1rem" },
  info:  { flex:1, minWidth:0 },
  title: { fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px", display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" as const },
  tag:   { padding:"1px 6px", borderRadius:"999px", fontSize:".62rem", fontWeight:700, background:"#D1FAE5", color:"#065F46" },
  btnP:  { padding:".5rem 1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" as const },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:".9rem 1.25rem", fontSize:".78rem", color:"#0369A1", marginTop:"1rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:  { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

export default function StudentDownloads() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    fetch("/api/student/downloads")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setDownloads(d.data); })
      .finally(()=>setLoading(false));
  },[]);

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Downloads</h1>
        <p style={C.sub}>All your delivered chapters ready to download.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : downloads.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>📭</div>
            <div style={C.etitle}>No files ready yet.</div>
            <div style={C.esub}>Delivered chapters will appear here.</div>
          </div>
        ) : (
          <>
            {downloads.map((d:any)=>(
              <div key={d.id} style={C.card}>
                <div style={C.info}>
                  <div style={C.title}>{d.chapterLabel}</div>
                  <div style={C.meta}>
                    <span>{d.topic}</span>
                    <span>·</span>
                    <span>{DEG[d.degreeGroup]||d.degreeGroup}</span>
                    {d.isQcCleared&&<span style={C.tag}>QC Cleared ✓</span>}
                    {d.deliveredAt&&<span style={{color:"#5B7EA6"}}>{new Date(d.deliveredAt).toLocaleDateString("en-NG")}</span>}
                  </div>
                </div>
                {d.fileUrl
                  ? <button style={C.btnP} onClick={()=>window.open(d.fileUrl,"_blank")}>⬇ Download</button>
                  : <span style={{fontSize:".75rem",color:"#5B7EA6",flexShrink:0}}>Not available</span>}
              </div>
            ))}
            <div style={C.notice}>ℹ Files are available for 90 days after delivery. Save copies to your device or Google Drive.</div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
