"use client";
// src/components/student/StudentLayout.tsx

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "clsx";

const STUDENT_NAV = [
  { label: "Home",               icon: "🏠", href: "/student/dashboard"    },
  { label: "Hire a Writer",      icon: "✍️", href: "/student/hire"          },
  { label: "Works in Progress",  icon: "⏳", href: "/student/inprogress"    },
  { label: "Completed Works",    icon: "✅", href: "/student/completed"     },
  { label: "Request Correction", icon: "🔧", href: "/student/corrections"   },
  { label: "Downloads",          icon: "⬇️", href: "/student/downloads"     },
  { label: "Notifications",      icon: "🔔", href: "/student/notifications"  },
  { label: "Profile",            icon: "👤", href: "/student/profile"        },
];

export function StudentLayout({ children, badges = {} }: {
  children: React.ReactNode;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const nav = STUDENT_NAV.map(item => ({
    ...item,
    badge: badges[item.href] || 0,
  }));

  const initials = session?.user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="flex min-h-screen bg-sky-50">
      {open && (
        <div className="fixed inset-0 bg-navy/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={clsx(
        "fixed top-0 left-0 h-full w-[215px] bg-navy z-50 flex flex-col py-5 px-3 transition-transform duration-250",
        "lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="font-clash text-[.95rem] font-800 text-white px-2 pb-4 border-b border-white/10 mb-4">
          iProject<span className="text-sky-400">Master</span>
        </div>
        <nav className="flex flex-col gap-px flex-1 overflow-y-auto">
          {nav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button key={item.href} onClick={() => { router.push(item.href); setOpen(false); }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-[.77rem] font-500 transition-all w-full text-left",
                  active ? "bg-sky-400/15 text-sky-400 font-600" : "text-navy-muted hover:bg-sky-400/8 hover:text-sky-200"
                )}
              >
                <span className="text-[.85rem] w-4 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-sky-400 text-navy text-[.56rem] font-800 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 bg-sky-400/8 rounded-lg border border-sky-400/12 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-[.68rem] font-800 text-navy flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-[.73rem] font-600 text-white leading-tight truncate max-w-[120px]">
                {session?.user?.name || "Student"}
              </div>
              <div className="text-[.6rem] text-navy-muted">Student</div>
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
          <span className="font-clash text-white text-[.9rem] font-800">iProject<span className="text-sky-400">Master</span></span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
