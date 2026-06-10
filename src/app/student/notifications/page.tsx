"use client";
// src/app/student/notifications/page.tsx
import { StudentLayout } from "@/components/student/StudentLayout";
import { NotificationsPage } from "@/components/staff/NotificationsPage";
export default function StudentNotifications() {
  return <StudentLayout><NotificationsPage /></StudentLayout>;
}
