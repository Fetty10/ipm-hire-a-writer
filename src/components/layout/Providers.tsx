"use client";
// src/components/layout/Providers.tsx

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Satoshi, sans-serif",
            fontSize: "0.88rem",
            fontWeight: 500,
            borderRadius: "12px",
            border: "1px solid rgba(56,189,248,0.20)",
            boxShadow: "0 8px 32px rgba(14,165,233,0.15)",
          },
          success: {
            style: { background: "#0C1A2E", color: "#38BDF8" },
            iconTheme: { primary: "#38BDF8", secondary: "#0C1A2E" },
          },
          error: {
            style: { background: "#0C1A2E", color: "#FCA5A5" },
            iconTheme: { primary: "#FCA5A5", secondary: "#0C1A2E" },
          },
        }}
      />
    </SessionProvider>
  );
}
