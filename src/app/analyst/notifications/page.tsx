"use client";
// src/app/analyst/notifications/page.tsx
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { NotificationsPage } from "@/components/staff/NotificationsPage";

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

export default function AnalystNotifications() {
  const { data: session } = useSession();
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  return (
    <StaffLayout navItems={NAV} role="Analyst" initials={initials}>
      <NotificationsPage />
    </StaffLayout>
  );
}
