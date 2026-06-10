// src/app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "iProjectMaster — Hire a Writer",
  description: "Professional academic writing services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Satoshi:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-satoshi bg-sky-50 text-navy antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
