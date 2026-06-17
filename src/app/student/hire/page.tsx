// src/app/student/hire/page.tsx
import NextDynamic from "next/dynamic";

const HireAWriter = NextDynamic(() => import("./HireForm"), { ssr: false });

export default function HirePage() {
  return <HireAWriter />;
}
