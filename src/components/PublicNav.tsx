"use client";
// src/components/PublicNav.tsx
import { useState } from "react";
import Link from "next/link";

const navItems = [
  { label:"Pricing",     href:"/pricing",   highlight:false },
  { label:"About Us",    href:"/about",     highlight:false },
  { label:"FAQ",         href:"/faq",       highlight:false },
  { label:"Contact Us",  href:`https://wa.me/2348132926373?text=${encodeURIComponent("Hi, I have a question about iProjectMaster")}`, highlight:false, external:true },
  { label:"Terms of Use",href:"/terms",     highlight:false },
  { label:"Login",       href:"/login",     highlight:true  },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .pnav-desktop { display: flex; }
        .pnav-hamburger { display: none; }
        @media (max-width: 768px) {
          .pnav-desktop { display: none; }
          .pnav-hamburger { display: flex; }
        }
      `}</style>

      <div style={{ background:"#0C1A2E", padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:40 }}>
        <Link href="/register" style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#fff", textDecoration:"none" }}>
          iProject<span style={{color:"#38BDF8"}}>Master</span>
        </Link>

        {/* Desktop nav links */}
        <div className="pnav-desktop" style={{ gap:"1.5rem", alignItems:"center" }}>
          {navItems.map(item => (
            <Link key={item.label} href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noreferrer" : undefined}
              style={{
                fontWeight: item.highlight ? 700 : 600,
                fontSize:".82rem", textDecoration:"none",
                color: item.highlight ? "#0C1A2E" : "#CBD5E1",
                background: item.highlight ? "#38BDF8" : "transparent",
                padding: item.highlight ? ".4rem .85rem" : "0",
                borderRadius: item.highlight ? "8px" : "0",
              }}>
              {item.label === "Contact Us" ? "💬 Contact" : item.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button className="pnav-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label="Open navigation"
          style={{ background:"none", border:"none", cursor:"pointer", padding:".4rem", flexDirection:"column", gap:"5px" }}>
          {open
            ? <span style={{ color:"#38BDF8", fontSize:"1.25rem", lineHeight:1 }}>✕</span>
            : <>
                <span style={{ display:"block", width:"22px", height:"2px", background:"#fff", borderRadius:"2px" }} />
                <span style={{ display:"block", width:"22px", height:"2px", background:"#fff", borderRadius:"2px" }} />
                <span style={{ display:"block", width:"22px", height:"2px", background:"#fff", borderRadius:"2px" }} />
              </>
          }
        </button>
      </div>

      {/* Mobile slide-in panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position:"fixed", inset:0, background:"rgba(12,26,46,.5)", zIndex:38 }} />
          <div style={{
            position:"fixed", top:0, right:0, bottom:0, width:"260px",
            background:"#0C1A2E", zIndex:39, padding:"5rem 1.5rem 2rem",
            boxShadow:"-4px 0 24px rgba(0,0,0,.3)",
            display:"flex", flexDirection:"column", gap:".5rem",
          }}>
            <div style={{ position:"absolute", top:"1rem", right:"1.25rem" }}>
              <button onClick={() => setOpen(false)}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:"1.25rem" }}>✕</button>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:".65rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"#475569", marginBottom:".5rem" }}>
              Navigation
            </div>
            {navItems.map(item => (
              <Link key={item.label} href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                onClick={() => setOpen(false)}
                style={{
                  display:"block", padding:".75rem 1rem", borderRadius:"10px",
                  fontWeight: item.highlight ? 700 : 600,
                  fontSize:".88rem", textDecoration:"none",
                  background: item.highlight ? "#38BDF8" : "transparent",
                  color: item.highlight ? "#0C1A2E" : "#E2E8F0",
                }}>
                {item.label === "Contact Us" ? "💬 Contact Us" : item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
