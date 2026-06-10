"use client";
// src/components/ui/index.tsx
// Shared design-system components — sky blue theme

import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

// ─────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger" | "navy";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-satoshi font-700 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-sky-400 text-navy-DEFAULT hover:bg-sky-500 active:scale-[0.98]",
      outline: "border-2 border-sky-400 text-sky-600 hover:bg-sky-400 hover:text-navy-DEFAULT active:scale-[0.98]",
      ghost:   "text-sky-600 hover:bg-sky-100 active:scale-[0.98]",
      danger:  "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
      navy:    "bg-navy-DEFAULT text-sky-400 hover:bg-navy-mid active:scale-[0.98]",
    };

    const sizes = {
      sm: "text-xs px-3 py-2",
      md: "text-sm px-5 py-2.5",
      lg: "text-base px-7 py-3.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ─────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          "w-full px-4 py-3 rounded-xl border bg-white text-navy-DEFAULT placeholder:text-navy-muted",
          "text-sm font-satoshi transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
          error
            ? "border-red-400 focus:ring-red-300"
            : "border-sky-200 hover:border-sky-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-500">{error}</p>}
      {hint && !error && <p className="text-xs text-navy-muted">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ─────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          "w-full px-4 py-3 rounded-xl border bg-white text-navy-DEFAULT",
          "text-sm font-satoshi transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
          error ? "border-red-400" : "border-sky-200 hover:border-sky-300",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-500">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

// ─────────────────────────────────────────
// TEXTAREA
// ─────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={clsx(
          "w-full px-4 py-3 rounded-xl border bg-white text-navy-DEFAULT placeholder:text-navy-muted",
          "text-sm font-satoshi transition-all duration-200 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400",
          error ? "border-red-400" : "border-sky-200 hover:border-sky-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

// ─────────────────────────────────────────
// CARD
// ─────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx(
      "bg-white rounded-2xl border border-sky-100 shadow-card p-6",
      className
    )}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────
type BadgeVariant = "sky" | "green" | "yellow" | "red" | "gray" | "navy";

export function Badge({ children, variant = "sky" }: { children: ReactNode; variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    sky:    "bg-sky-100 text-sky-700 border-sky-200",
    green:  "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red:    "bg-red-50 text-red-600 border-red-200",
    gray:   "bg-gray-100 text-gray-600 border-gray-200",
    navy:   "bg-navy-DEFAULT text-sky-400 border-navy-mid",
  };

  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 border",
      styles[variant]
    )}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <svg
      className={clsx("animate-spin text-sky-400", sizes[size])}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─────────────────────────────────────────
// STATUS BADGE — maps order/chapter status to badge
// ─────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_PAYMENT:    { label: "Awaiting Payment",  variant: "yellow" },
  PAYMENT_CONFIRMED:  { label: "Payment Confirmed", variant: "sky"    },
  IN_PROGRESS:        { label: "In Progress",       variant: "sky"    },
  QC_REVIEW:          { label: "QC Review",         variant: "yellow" },
  DELIVERED:          { label: "Delivered",         variant: "green"  },
  REVISION_REQUESTED: { label: "Revision",          variant: "red"    },
  CANCELLED:          { label: "Cancelled",         variant: "gray"   },
  NOT_STARTED:        { label: "Not Started",       variant: "gray"   },
  PRELIM_SUBMITTED:   { label: "Prelim Submitted",  variant: "sky"    },
  SUBMITTED:          { label: "Submitted",         variant: "sky"    },
  QC_IN_PROGRESS:     { label: "QC In Progress",    variant: "yellow" },
  QC_DONE:            { label: "QC Done",           variant: "green"  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
