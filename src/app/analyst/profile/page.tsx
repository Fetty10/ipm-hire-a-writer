"use client";
// src/app/analyst/profile/page.tsx
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { ProfilePage } from "@/components/staff/ProfilePage";

const NAV = [
  { label: "Dashboard",     icon: "📊", href: "/analyst/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/analyst/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/analyst/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/analyst/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/analyst/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/analyst/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/analyst/notifications" },
  { label: "Profile",       icon: "👤", href: "/analyst/profile"       },
];

export default function AnalystProfile() {
  const { data: session } = useSession();
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  return (
    <StaffLayout navItems={NAV} role="Analyst" initials={initials}>
      <ProfilePage />
    </StaffLayout>
  );
}
