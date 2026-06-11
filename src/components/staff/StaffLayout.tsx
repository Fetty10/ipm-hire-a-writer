"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const S = {
  wrap:    { display:"flex", minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" } as React.CSSProperties,
  sidebar: { width:"215px", background:"#0C1A2E", display:"flex", flexDirection:"column" as const, padding:"1.25rem .75rem", position:"sticky" as const, top:0, height:"100vh", flexShrink:0, overflowY:"auto" as const },
  logo:    { fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:800, color:"#fff", padding:".5rem", paddingBottom:"1rem", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:"1rem" },
  logoSpan:{ color:"#38BDF8" },
  navBtn:  { display:"flex", alignItems:"center", gap:".5rem", padding:".5rem .75rem", borderRadius:"10px", fontSize:".77rem", fontWeight:500, color:"#5B7EA6", cursor:"pointer", transition:"all .2s", width:"100%", background:"none", border:"none", textAlign:"left" as const, fontFamily:"'DM Sans',sans-serif" },
  navActive:{ background:"rgba(56,189,248,.15)", color:"#38BDF8", fontWeight:600 },
  badge:   { marginLeft:"auto", background:"#38BDF8", color:"#0C1A2E", fontSize:".56rem", fontWeight:800, padding:"2px 6px", borderRadius:"999px" },
  userBox: { display:"flex", alignItems:"center", gap:".5rem", padding:".5rem", background:"rgba(56,189,248,.08)", borderRadius:"10px", border:"1px solid rgba(56,189,248,.12)", marginBottom:".5rem", marginTop:"auto" },
  avatar:  { width:"32px", height:"32px", borderRadius:"50%", background:"#38BDF8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".68rem", fontWeight:800, color:"#0C1A2E", flexShrink:0 },
  uname:   { fontSize:".73rem", fontWeight:600, color:"#fff", lineHeight:1.2 },
  urole:   { fontSize:".6rem", color:"#5B7EA6" },
  logout:  { width:"100%", padding:".5rem .75rem", borderRadius:"10px", border:"1px solid rgba(239,68,68,.2)", background:"rgba(239,68,68,.08)", color:"#FCA5A5", fontSize:".73rem", fontWeight:600, cursor:"pointer", textAlign:"left" as const, fontFamily:"'DM Sans',sans-serif" },
  main:    { flex:1, padding:"1.5rem", overflowX:"hidden" as const, minWidth:0 },
  topbar:  { background:"#0C1A2E", height:"48px", display:"flex", alignItems:"center", padding:"0 1rem", gap:".75rem", borderBottom:"1px solid rgba(56,189,248,.1)" },
  overlay: { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:40 },
};

interface NavItem { label:string; icon:string; href:string; badge?:number; }

export function StaffLayout({ children, navItems, role, initials }: {
  children: React.ReactNode;
  navItems: NavItem[];
  role: string;
  initials: string;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div style={S.wrap}>
      {open && <div style={S.overlay} onClick={()=>setOpen(false)} />}

      {/* Sidebar */}
      <div style={{...S.sidebar,...(open?{}:{})}} className={`ipm-sidebar${open?" open":""}`}>
        <div style={S.logo}>
          iProject<span style={S.logoSpan}>Master</span>
        </div>

        <nav style={{display:"flex",flexDirection:"column",flex:1,overflowY:"auto",gap:"1px"}}>
          {navItems.map(item=>{
            const active = pathname===item.href||pathname.startsWith(item.href+"/");
            return (
              <button key={item.href} style={{...S.navBtn,...(active?S.navActive:{})}}
                onClick={()=>{ router.push(item.href); setOpen(false); }}
                onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="rgba(56,189,248,.08)"; }}
                onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLElement).style.background="none"; }}>
                <span style={{fontSize:".85rem",width:"16px",textAlign:"center",flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {item.badge!=null&&item.badge>0&&<span style={S.badge}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div style={S.userBox}>
          <div style={S.avatar}>{initials}</div>
          <div>
            <div style={S.uname}>{session?.user?.name||"Staff"}</div>
            <div style={S.urole}>{role}</div>
          </div>
        </div>
        <button style={S.logout} onClick={()=>signOut({callbackUrl:"/login"})}>🚪 Logout</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Mobile topbar */}
        <div style={{...S.topbar,display:"none"}} className="mobile-topbar">
          <button style={{background:"none",border:"none",color:"#38BDF8",fontSize:"1.4rem",cursor:"pointer"}} onClick={()=>setOpen(true)}>☰</button>
          <span style={{fontFamily:"'Syne',sans-serif",color:"#fff",fontSize:".9rem",fontWeight:800}}>
            iProject<span style={{color:"#38BDF8"}}>Master</span>
          </span>
        </div>
        <main style={S.main}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .ipm-sidebar { position: fixed !important; top: 0; left: 0; height: 100% !important; z-index: 50; transform: translateX(-100%); transition: transform .25s; }
          .ipm-sidebar.open { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}
