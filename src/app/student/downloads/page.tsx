"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const DEG:Record<string,string>={OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem 1.25rem", marginBottom:".6rem" },
  row:   { display:"flex", alignItems:"center", gap:"1rem" },
  info:  { flex:1, minWidth:0 },
  title: { fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px", display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" as const },
  tag:   { padding:"1px 6px", borderRadius:"999px", fontSize:".62rem", fontWeight:700, background:"#D1FAE5", color:"#065F46" },
  corrTag:{ padding:"1px 6px", borderRadius:"999px", fontSize:".62rem", fontWeight:700, background:"#FFEDD5", color:"#9A3412", cursor:"pointer" },
  btnP:  { padding:".5rem 1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" as const },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:".9rem 1.25rem", fontSize:".78rem", color:"#0369A1", marginTop:"1rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:  { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
  hist:  { marginTop:".85rem", paddingTop:".85rem", borderTop:"1px dashed #FED7AA" },
  histItem:{ background:"#FFF7ED", borderRadius:"10px", padding:".85rem", marginBottom:".6rem", fontSize:".78rem" },
  histLbl:{ fontWeight:700, color:"#9A3412", fontSize:".68rem", textTransform:"uppercase" as const, letterSpacing:".06em", marginBottom:".3rem" },
  histReq:{ color:"#7C2D12", lineHeight:1.5, marginBottom:".6rem" },
  histFiles:{ display:"flex", gap:".5rem", flexWrap:"wrap" as const },
  fileBtn:{ padding:".4rem .8rem", borderRadius:"8px", fontSize:".72rem", fontWeight:700, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:".3rem" },
  fileBefore:{ background:"#FEE2E2", color:"#991B1B" },
  fileAfter:{ background:"#D1FAE5", color:"#065F46" },
  histDate:{ fontSize:".68rem", color:"#9A3412", marginTop:".5rem" },
};

export default function StudentDownloads() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string|null>(null);
  const [history,   setHistory]   = useState<Record<string,any[]>>({});
  const [loadingHist, setLoadingHist] = useState<string|null>(null);

  useEffect(()=>{
    fetch("/api/student/downloads").then(r=>r.json()).then(d=>{ if(d.success) setDownloads(d.data); setLoading(false); });
  },[]);

  async function toggleHistory(chapterId: string) {
    if (expanded === chapterId) { setExpanded(null); return; }
    setExpanded(chapterId);
    if (!history[chapterId]) {
      setLoadingHist(chapterId);
      const res  = await fetch(`/api/student/correction-history?chapterId=${chapterId}`);
      const data = await res.json();
      if (data.success) setHistory(prev => ({ ...prev, [chapterId]: data.data }));
      setLoadingHist(null);
    }
  }

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
                <div style={C.row}>
                  <div style={C.info}>
                    <div style={C.title}>{d.chapterLabel}</div>
                    <div style={C.meta}>
                      <span>{d.topic}</span>
                      <span>·</span>
                      <span>{DEG[d.degreeGroup]||d.degreeGroup}</span>
                      {d.isQcCleared&&<span style={C.tag}>QC Cleared ✓</span>}
                      {d.plagiarismScore!=null&&<span style={{padding:"1px 6px",borderRadius:"999px",fontSize:".62rem",fontWeight:700,background:"#EDE9FE",color:"#5B21B6"}}>Plagiarism: {d.plagiarismScore}%</span>}
                      {d.aiScore!=null&&<span style={{padding:"1px 6px",borderRadius:"999px",fontSize:".62rem",fontWeight:700,background:"#FEF9C3",color:"#854D0E"}}>AI: {d.aiScore}%</span>}
                      {d.correctionCount>0&&(
                        <span style={C.corrTag} onClick={()=>toggleHistory(d.id)}>
                          🔧 Corrected {d.correctionCount}x {expanded===d.id?"▲":"▼"}
                        </span>
                      )}
                      {d.deliveredAt&&<span style={{color:"#5B7EA6"}}>{new Date(d.deliveredAt).toLocaleDateString("en-NG")}</span>}
                    </div>
                  </div>
                  {d.fileUrl
                    ? d.fileUrl.includes(",")
                      ? <div style={{display:"flex",flexDirection:"column" as const,gap:".4rem"}}>
                          {d.fileUrl.split(",").map((url:string,i:number,arr:string[]) => (
                            <button key={i} style={C.btnP}
                              onClick={()=>window.open(`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=${encodeURIComponent(`${d.chapterLabel}${arr.length>1?` File ${i+1}`:""} ${d.topic}`)}`, "_blank")}>
                              ⬇ {arr.length>1?`File ${i+1}`:"Download"}
                            </button>
                          ))}
                        </div>
                      : <button style={C.btnP} onClick={()=>window.open(`/api/download?chapterId=${d.id}`,"_blank")}>⬇ Download</button>
                    : <span style={{fontSize:".75rem",color:"#5B7EA6",flexShrink:0}}>Not available</span>}
                </div>

                {expanded===d.id && (
                  <div style={C.hist}>
                    {loadingHist===d.id ? (
                      <p style={{fontSize:".78rem",color:"#5B7EA6"}}>Loading history...</p>
                    ) : (history[d.id]||[]).length === 0 ? (
                      <p style={{fontSize:".78rem",color:"#5B7EA6"}}>No history found.</p>
                    ) : (
                      history[d.id].map((h:any) => (
                        <div key={h.id} style={C.histItem}>
                          <div style={C.histLbl}>📋 What You Requested</div>
                          <div style={C.histReq}>{h.studentRequest}</div>
                          <div style={C.histFiles}>
                            {h.fileBeforeUrl && (
                              <a href={`/api/download/guideline?url=${encodeURIComponent(h.fileBeforeUrl)}&label=${encodeURIComponent(`${d.chapterLabel} Before Correction ${d.topic}`)}`}
                                target="_blank" rel="noreferrer" style={{...C.fileBtn,...C.fileBefore}}>
                                📄 Before (Original)
                              </a>
                            )}
                            {h.fileAfterUrl && (
                              <a href={`/api/download/guideline?url=${encodeURIComponent(h.fileAfterUrl)}&label=${encodeURIComponent(`${d.chapterLabel} After Correction ${d.topic}`)}`}
                                target="_blank" rel="noreferrer" style={{...C.fileBtn,...C.fileAfter}}>
                                ✅ After (Corrected)
                              </a>
                            )}
                          </div>
                          <div style={C.histDate}>
                            Requested {new Date(h.requestedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}
                            {" · "}Resolved {new Date(h.resolvedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
            <div style={C.notice}>ℹ Files are available for 90 days after delivery. Save copies to your device or Google Drive.</div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
