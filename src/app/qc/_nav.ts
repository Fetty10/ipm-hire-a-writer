// src/app/qc/_nav.ts
// Shared nav config for all QC pages

export const QC_NAV = [
  { label: "Dashboard",          icon: "📊", href: "/qc/dashboard"             },
  { label: "Pending Checks",     icon: "🔍", href: "/qc/checks/pending"         },
  { label: "Active Checks",      icon: "⚙️", href: "/qc/checks/active"          },
  { label: "Cleared & Sent",     icon: "✅", href: "/qc/checks/cleared"         },
  { label: "Pending Corrections",icon: "🔧", href: "/qc/corrections/pending"    },
  { label: "Working on Corrections", icon: "✏️", href: "/qc/corrections/active" },
  { label: "Corrections Sent",   icon: "📨", href: "/qc/corrections/done"       },
  { label: "Earnings",           icon: "💰", href: "/qc/earnings"               },
  { label: "Withdraw",           icon: "🏦", href: "/qc/withdraw"               },
  { label: "Notifications",      icon: "🔔", href: "/qc/notifications"          },
  { label: "Profile",            icon: "👤", href: "/qc/profile"                },
];
