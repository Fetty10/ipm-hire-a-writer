"use client";
// src/app/qc/profile/page.tsx
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { ProfilePage } from "@/components/staff/ProfilePage";

const NAV = [
  { label: "Dashboard",     icon: "📊", href: "/qc/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/qc/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/qc/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/qc/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/qc/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/qc/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/qc/notifications" },
  { label: "Profile",       icon: "👤", href: "/qc/profile"       },
];

export default function QCProfile() {
  const { data: session } = useSession();
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  return (
    <StaffLayout navItems={NAV} role="Quality Control" initials={initials}>
      <ProfilePage />
    </StaffLayout>
  );
}
