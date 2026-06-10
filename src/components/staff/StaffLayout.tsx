"use client";
// src/components/staff/StaffLayout.tsx
// Shared layout for Writer, Analyst and QC dashboards

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { clsx } from "clsx";

interface NavItem {
  label:  string;
  icon:   string;
  href:   string;
  badge?: number;
}

interface StaffLayoutProps {
  children:  React.ReactNode;
  navItems:  NavItem[];
  role:      string;
  initials:  string;
}

export function StaffLayout({ children, navItems, role, initials }: StaffLayoutProps) {
  const pathname        = usePathname();
  const router          = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNav(href: string) {
    router.push(href);
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-sky-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/60 z-40 lg:hidden"
          style={{ top: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={clsx(
        "fixed top-0 left-0 h-full w-[215px] bg-navy z-50 flex flex-col py-5 px-3 transition-transform duration-250",
        "lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="font-clash text-[.95rem] font-800 text-white px-2 pb-4 border-b border-white/10 mb-4">
          iProject<span className="text-sky-400">Master</span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-px flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-[.77rem] font-500 transition-all w-full text-left",
                  active
                    ? "bg-sky-400/15 text-sky-400 font-600"
                    : "text-navy-muted hover:bg-sky-400/8 hover:text-sky-200"
                )}
              >
                <span className="text-[.85rem] w-4 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-auto bg-sky-400 text-navy text-[.56rem] font-800 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 bg-sky-400/8 rounded-lg border border-sky-400/12 mb-2">
            <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-[.68rem] font-800 text-navy flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-[.73rem] font-600 text-white leading-tight">
                {session?.user?.name || "Staff"}
              </div>
              <div className="text-[.6rem] text-navy-muted">{role}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[.73rem] font-600 text-red-300 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 transition-all"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 bg-navy h-12 flex items-center px-4 gap-3 border-b border-sky-400/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-sky-400 text-xl p-1"
          >
            ☰
          </button>
          <span className="font-clash text-white text-[.9rem] font-800">
            iProject<span className="text-sky-400">Master</span>
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
