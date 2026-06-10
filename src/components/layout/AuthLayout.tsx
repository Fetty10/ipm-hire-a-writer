// src/components/layout/AuthLayout.tsx
import { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sky-200 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-300 rounded-full opacity-15 blur-3xl translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-navy-DEFAULT border-b border-sky-900/20 px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-clash text-xl font-700 text-white">
          iProject<span className="text-sky-400">Master</span>
        </a>
        <span className="text-xs text-navy-muted font-500">Hire a Writer</span>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-navy-muted">
        © {new Date().getFullYear()} iProjectMaster. All rights reserved.
      </footer>
    </div>
  );
}
