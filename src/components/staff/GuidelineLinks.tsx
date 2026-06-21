// Helper component — shows multiple guideline download links
// Drop this inline in JobCard where guidelineFileUrl is rendered

// Usage: replace the single <a> tag with this logic:
// {job.guidelineFileUrl && <GuidelineLinks url={job.guidelineFileUrl} />}

function proxyUrl(rawUrl: string, label: string): string {
  return `/api/download/guideline?url=${encodeURIComponent(rawUrl)}&label=${encodeURIComponent(label)}`;
}

export function GuidelineLinks({ url, topic }: { url: string; topic?: string }) {
  const urls = url.split(",").map(u => u.trim()).filter(Boolean);
  if (urls.length === 0) return null;

  const baseLabel = topic ? `${topic} Guideline` : "Guideline File";

  if (urls.length === 1) {
    return (
      <a href={proxyUrl(urls[0], baseLabel)} target="_blank" rel="noreferrer"
        style={{display:"inline-flex",alignItems:"center",gap:".3rem",fontSize:".78rem",fontWeight:600,color:"#0369A1",textDecoration:"none",marginBottom:"1rem"}}>
        📎 Download Guideline File
      </a>
    );
  }
  return (
    <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".75rem 1rem",marginBottom:"1rem"}}>
      <p style={{fontSize:".65rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"#0369A1",marginBottom:".5rem"}}>
        Guideline Files ({urls.length})
      </p>
      {urls.map((u, i) => (
        <a key={i} href={proxyUrl(u, `${baseLabel} ${i + 1}`)} target="_blank" rel="noreferrer"
          style={{display:"flex",alignItems:"center",gap:".4rem",fontSize:".78rem",fontWeight:600,color:"#0369A1",textDecoration:"none",marginBottom:".3rem"}}>
          📎 Download File {i + 1}
        </a>
      ))}
    </div>
  );
}
