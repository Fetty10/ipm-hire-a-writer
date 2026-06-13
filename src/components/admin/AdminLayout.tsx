"use client";
// src/components/admin/AdminLayout.tsx
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "clsx";

const NAV = [
  { label: "Overview",      icon: "📊", href: "/admin/dashboard",           section: "Overview"  },
  { label: "All Orders",    icon: "📦", href: "/admin/orders",               section: "Overview"  },
  { label: "Approvals",     icon: "⏳", href: "/admin/staff/approvals",      section: "Staff"     },
  { label: "All Staff",     icon: "👥", href: "/admin/staff/list",           section: "Staff"     },
  { label: "Withdrawals",   icon: "💸", href: "/admin/withdrawals",          section: "Staff"     },
  { label: "Pay Rates",     icon: "💰", href: "/admin/settings/payrates",       section: "Settings"  },
  { label: "Plans & Pricing",icon:"💳", href: "/admin/settings/plans",          section: "Settings"  },
  { label: "Other Services", icon:"🛠️", href: "/admin/settings/other-services", section: "Settings"  },
  { label: "Departments",   icon: "🏛️", href: "/admin/settings/departments",    section: "Settings"  },
  { label: "Settings",      icon: "⚙️", href: "/admin/settings",                section: "Settings"  },
];

export function AdminLayout({ children, badges = {} }: {
  children: React.ReactNode;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const sections = ["Overview", "Staff", "Settings"];

  return (
    <div className="flex min-h-screen bg-sky-50">
      {open && <div className="fixed inset-0 bg-navy/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={clsx(
        "fixed top-0 left-0 h-full w-[220px] bg-navy z-50 flex flex-col py-5 px-3 transition-transform duration-250",
        "lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="font-clash text-[.95rem] font-800 text-white px-2 pb-4 border-b border-white/10 mb-4">
          iProject<span className="text-sky-400">Master</span>
          <div className="text-[.6rem] text-sky-400 font-600 mt-0.5">Admin Panel</div>
        </div>

        <nav className="flex flex-col flex-1 overflow-y-auto gap-px">
          {sections.map(section => (
            <div key={section}>
              <p className="text-[.58rem] font-700 uppercase tracking-widest text-white/30 px-2 py-1 mt-2">{section}</p>
              {NAV.filter(n => n.section === section).map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const badge  = badges[item.href] || 0;
                return (
                  <button key={item.href} onClick={() => { router.push(item.href); setOpen(false); }}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-[.77rem] font-500 transition-all w-full text-left",
                      active ? "bg-sky-400/15 text-sky-400 font-600" : "text-navy-muted hover:bg-sky-400/8 hover:text-sky-200"
                    )}>
                    <span className="text-[.85rem] w-4 text-center flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && <span className="bg-sky-400 text-navy text-[.56rem] font-800 px-1.5 py-0.5 rounded-full">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 bg-sky-400/8 rounded-lg border border-sky-400/12 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-[.68rem] font-800 text-white flex-shrink-0">MA</div>
            <div>
              <div className="text-[.73rem] font-600 text-white leading-tight truncate max-w-[120px]">{session?.user?.name}</div>
              <div className="text-[.6rem] text-sky-400">{session?.user?.role?.replace("_"," ")}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[.73rem] font-600 text-red-300 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 transition-all">
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-navy h-12 flex items-center px-4 gap-3 border-b border-sky-400/10">
          <button onClick={() => setOpen(true)} className="text-sky-400 text-xl p-1">☰</button>
          <span className="font-clash text-white text-[.9rem] font-800">iProject<span className="text-sky-400">Master</span> <span className="text-sky-400 text-[.7rem]">Admin</span></span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
