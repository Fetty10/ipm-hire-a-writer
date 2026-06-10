"use client";
// src/components/staff/NotificationsPage.tsx
// Shared notifications page — used by Writer, Analyst, QC

import { useEffect, useState } from "react";
import { Card, Button, Spinner } from "@/components/ui";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface Notification {
  id:        string;
  title:     string;
  message:   string;
  type:      string;
  isRead:    boolean;
  createdAt: string;
}

const TYPE_STYLES: Record<string, { dot: string; border: string }> = {
  ACTION_REQUIRED: { dot: "bg-sky-400",    border: "border-l-sky-400"    },
  INFO:            { dot: "bg-sky-300",    border: "border-l-sky-300"    },
  SUCCESS:         { dot: "bg-green-400",  border: "border-l-green-400"  },
  ALERT:           { dot: "bg-red-400",    border: "border-l-red-400"    },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationsPage() {
  const [notifs,   setNotifs]   = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);

  async function load() {
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    if (data.success) setNotifs(data.data.notifications);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    setMarking(true);
    await fetch("/api/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ markAllRead: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All marked as read.");
    setMarking(false);
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ notificationId: id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-navy-muted mt-0.5">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" loading={marking} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-navy-muted font-600">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map((n) => {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.INFO;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={clsx(
                  "bg-white rounded-2xl border border-sky-100 shadow-card p-4 border-l-4 transition-all cursor-pointer",
                  style.border,
                  !n.isRead && "ring-1 ring-sky-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className={clsx("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", style.dot,
                      n.isRead && "opacity-30")} />
                    <div>
                      <p className={clsx("text-sm font-700 text-navy-DEFAULT", n.isRead && "font-600 text-navy-muted")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-navy-muted mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-navy-muted whitespace-nowrap flex-shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
