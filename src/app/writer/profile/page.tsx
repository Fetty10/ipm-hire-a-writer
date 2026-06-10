"use client";
// src/app/writer/profile/page.tsx
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { ProfilePage } from "@/components/staff/ProfilePage";

const NAV = [
  { label: "Dashboard",     icon: "📊", href: "/writer/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/writer/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/writer/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/writer/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/writer/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/writer/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/writer/notifications" },
  { label: "Profile",       icon: "👤", href: "/writer/profile"       },
];

export default function WriterProfile() {
  const { data: session } = useSession();
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  return (
    <StaffLayout navItems={NAV} role="Writer" initials={initials}>
      <ProfilePage />
    </StaffLayout>
  );
}
