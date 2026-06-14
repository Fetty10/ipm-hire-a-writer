// src/lib/workingDays.ts
// Working days utility — skips weekends (Sat/Sun)

/**
 * Add N working days to a date.
 * Starts counting from the NEXT day after `from`.
 */
export function addWorkingDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

/**
 * Get deadline for staff based on role and plan.
 * - QC: always 1 working day (2 if correction)
 * - Writer/Analyst: 2 days for Professional/PhD Pro, 3 days for others
 */
export function getStaffDeadlineDays(
  role: "WRITER" | "ANALYST" | "QC",
  planName: string,
  isCorrection = false
): number {
  if (role === "QC") return isCorrection ? 2 : 1;
  const isPro = planName === "PROFESSIONAL" || planName === "PHD_PROFESSIONAL";
  return isPro ? 2 : 3;
}

export function getStaffDeadline(
  startedAt: Date,
  role: "WRITER" | "ANALYST" | "QC",
  planName: string,
  isCorrection = false
): Date {
  return addWorkingDays(startedAt, getStaffDeadlineDays(role, planName, isCorrection));
}

/** Student always gets 3 working days from day after order. */
export function getStudentDeliveryDate(orderedAt: Date): Date {
  return addWorkingDays(orderedAt, 3);
}

/** Format date nicely */
export function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

/** Days remaining (negative = overdue) */
export function daysUntil(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
