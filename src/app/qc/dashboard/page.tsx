"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { QC_NAV } from "../_nav";

const C = {
  page:   { maxWidth:"800px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  grid4:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem", marginBottom:"1.25rem" },
  scard:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem", cursor:"pointer", transition:"all .2s" },
  sicon:  { fontSize:"1.3rem", marginBottom:".5rem" },
  sval:   { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0C1A2E", lineHeight:1 },
  slabel: { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" },
  flowCard:{ background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", cursor:"pointer", transition:"all .2s" },
  flowCardA:{ border:"2px solid #38BDF8" },
  ficon:  { fontSize:"1.5rem", marginBottom:".75rem" },
  ftitle: { fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:700, color:"#0C1A2E", marginBottom:".4rem" },
  fsub:   { fontSize:".78rem", color:"#5B7EA6", marginBottom:"1rem", lineHeight:1.5 },
  badges: { display:"flex", gap:".4rem", flexWrap:"wrap" as const },
  badge:  { display:"inline-flex", padding:"2px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700 },
  bY:     { background:"#FEF9C3", color:"#854D0E" },
  bS:     { background:"#E0F2FE", color:"#0369A1" },
  bG:     { background:"#D1FAE5", color:"#065F46" },
  bO:     { background:"#FFEDD5", color:"#9A3412" },
  earBox: { background:"#0C1A2E", borderRadius:"16px", padding:"1.25rem", color:"#fff", cursor:"pointer" },
  earLbl: { fontSize:".68rem", color:"#7DD3FC", textTransform:"uppercase" as const, letterSpacing:".08em", fontWeight:700, marginBottom:".3rem" },
  earVal: { fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", marginBottom:".75rem" },
  earSub: { fontSize:".75rem", color:"#7DD3FC" },
  howCard:{ background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem" },
  howTitle:{ fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  howRow: { display:"flex", gap:".75rem", alignItems:"flex-start", marginBottom:".9rem" },
  howNum: { width:"28px", height:"28px", borderRadius:"50%", background:"#E0F2FE", color:"#0369A1", fontSize:".75rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  howTxt: { flex:1 },
  howH:   { fontSize:".82rem", fontWeight:700, color:"#0C1A2E", marginBottom:".2rem" },
  howP:   { fontSize:".75rem", color:"#5B7EA6", lineHeight:1.5 },
};

export default function QCDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [counts, setCounts] = useState({ checksP:0, checksA:0, checksC:0, corrP:0, corrA:0, corrD:0, available:0, totalEarned:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [checksP, checksA, checksC, corrP, corrA, corrD, earn] = await Promise.all([
        fetch("/api/qc/jobs?flow=checks&status=pending").then(r=>r.json()),
        fetch("/api/qc/jobs?flow=checks&status=active").then(r=>r.json()),
        fetch("/api/qc/jobs?flow=checks&status=cleared").then(r=>r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=pending").then(r=>r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=active").then(r=>r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=cleared").then(r=>r.json()),
        fetch("/api/staff/earnings").then(r=>r.json()),
      ]);
      setCounts({
        checksP: checksP.data?.length||0, checksA: checksA.data?.length||0, checksC: checksC.data?.length||0,
        corrP: corrP.data?.length||0, corrA: corrA.data?.length||0, corrD: corrD.data?.length||0,
        available: earn.data?.summary?.available||0, totalEarned: earn.data?.summary?.totalEarned||0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const nav = QC_NAV.map(item => {
    if (item.href==="/qc/checks/pending")      return {...item, badge:counts.checksP};
    if (item.href==="/qc/checks/active")       return {...item, badge:counts.checksA};
    if (item.href==="/qc/corrections/pending") return {...item, badge:counts.corrP};
    if (item.href==="/qc/corrections/active")  return {...item, badge:counts.corrA};
    return item;
  });

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const name     = session?.user?.name?.split(" ")[0]||"QC";

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>QC Dashboard</h1>
        <p style={C.sub}>Welcome back, {name}. You handle two flows here.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            {/* Stats */}
            <div style={C.grid4}>
              {[
                {icon:"🔍", val:counts.checksP+counts.checksA, label:"Total Checks",    href:"/qc/checks/pending"},
                {icon:"⚙️", val:counts.checksA,                label:"Active Checks",   href:"/qc/checks/active"},
                {icon:"🔧", val:counts.corrP+counts.corrA,     label:"Corrections",     href:"/qc/corrections/pending"},
                {icon:"✅", val:counts.checksC+counts.corrD,   label:"Completed",       href:"/qc/checks/cleared"},
              ].map(s=>(
                <div key={s.label} style={C.scard} onClick={()=>router.push(s.href)}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#38BDF8";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E0F2FE";}}>
                  <div style={C.sicon}>{s.icon}</div>
                  <div style={C.sval}>{s.val}</div>
                  <div style={C.slabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Two flow cards */}
            <div style={C.grid2}>
              <div style={{...C.flowCard,...C.flowCardA}} onClick={()=>router.push("/qc/checks/pending")}>
                <div style={C.ficon}>🔍</div>
                <div style={C.ftitle}>AI & Plagiarism Checks</div>
                <div style={C.fsub}>Professional plan chapters submitted by writers/analysts — auto-routed to you for checking before delivery.</div>
                <div style={C.badges}>
                  <span style={{...C.badge,...C.bY}}>{counts.checksP} Pending</span>
                  <span style={{...C.badge,...C.bS}}>{counts.checksA} Active</span>
                  <span style={{...C.badge,...C.bG}}>{counts.checksC} Cleared</span>
                </div>
              </div>

              <div style={C.flowCard} onClick={()=>router.push("/qc/corrections/pending")}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#38BDF8";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E0F2FE";}}>
                <div style={C.ficon}>🔧</div>
                <div style={C.ftitle}>Student Corrections</div>
                <div style={C.fsub}>Correction requests from students on delivered work — you handle them first before escalating to writer if needed.</div>
                <div style={C.badges}>
                  <span style={{...C.badge,...C.bO}}>{counts.corrP} Pending</span>
                  <span style={{...C.badge,...C.bY}}>{counts.corrA} In Progress</span>
                  <span style={{...C.badge,...C.bG}}>{counts.corrD} Done</span>
                </div>
              </div>
            </div>

            {/* How it works + Earnings */}
            <div style={C.grid2}>
              <div style={C.howCard}>
                <div style={C.howTitle}>How QC Works</div>
                {[
                  { n:"1", title:"Professional Plan → Auto-routed to you", desc:"Every Professional plan chapter goes to you after writer/analyst submits. Run checks, upload cleared version, send to student." },
                  { n:"2", title:"Student Corrections → You handle first", desc:"When a student requests a correction, it comes to you. Fix it and send back — or escalate to the writer if it needs content changes." },
                ].map(item=>(
                  <div key={item.n} style={C.howRow}>
                    <div style={C.howNum}>{item.n}</div>
                    <div style={C.howTxt}>
                      <div style={C.howH}>{item.title}</div>
                      <div style={C.howP}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={C.earBox} onClick={()=>router.push("/qc/earnings")}>
                <div style={C.earLbl}>Available Balance</div>
                <div style={C.earVal}>₦{counts.available.toLocaleString()}</div>
                <div style={C.earSub}>Total earned: ₦{counts.totalEarned.toLocaleString()}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
