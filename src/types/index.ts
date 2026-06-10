// src/types/index.ts
// Shared TypeScript types used across the application

import type {
  User, Order, OrderChapter, Earning, Withdrawal,
  Plan, PayRate, Notification, ExceptionDepartment,
  Role, OrderStatus, ChapterStatus, EarningStatus, WithdrawalStatus,
  DegreeGroup, PlanName, AssigneeRole
} from "@prisma/client";

// Re-export Prisma enums for convenience
export {
  Role, OrderStatus, ChapterStatus, EarningStatus, WithdrawalStatus,
  DegreeGroup, PlanName, AssigneeRole
};

// ─────────────────────────────────────────
// SESSION / AUTH
// ─────────────────────────────────────────

export interface SessionUser {
  id:    string;
  name:  string;
  email: string;
  role:  Role;
}

// ─────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────

export interface ApiSuccess<T = undefined> {
  success: true;
  data?:   T;
  message?: string;
}

export interface ApiError {
  success: false;
  error:   string;
  code?:   string;
}

export type ApiResponse<T = undefined> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────
// CHAPTER WITH RELATED DATA
// ─────────────────────────────────────────

export type ChapterWithOrder = OrderChapter & {
  order: Order & {
    plan: Plan;
    client: Pick<User, "id" | "name" | "email">;
  };
  assignedTo: Pick<User, "id" | "name" | "role"> | null;
};

// What a writer/analyst sees for a job (no student name/plan price)
export interface StaffJobView {
  id:             string;
  chapterNumber:  number;
  chapterLabel:   string;
  status:         ChapterStatus;
  topic:          string;
  department:     string;
  degreeGroup:    DegreeGroup;
  requiresPrelim: boolean;
  // Prelim fields (Chapter 1)
  researchObjectives:  string | null;
  researchQuestions:   string | null;
  hypotheses:          string | null;
  scopeOfStudy:        string | null;
  prelimSubmittedAt:   Date | null;
  // Files
  submittedFileUrl:    string | null;
  deliveredFileUrl:    string | null;
  guidelineFileUrl:    string | null;   // student's uploaded format
  // Student instructions (no name)
  specialInstructions: string | null;
  // Dates
  createdAt:           Date;
  submittedAt:         Date | null;
  deliveredAt:         Date | null;
  // Writer's prelim notes (for analysts on Ch 3 & 4)
  writerPrelimNotes?: {
    objectives: string | null;
    questions:  string | null;
    hypotheses: string | null;
    scope:      string | null;
  } | null;
}

// ─────────────────────────────────────────
// EARNINGS
// ─────────────────────────────────────────

export interface EarningWithChapter extends Earning {
  orderChapter: {
    chapterLabel:  string;
    order: {
      topic:       string;
      degreeGroup: DegreeGroup;
      plan: { planName: PlanName };
    };
  };
}

export interface EarningsSummary {
  available:  number;  // in kobo
  pending:    number;
  totalEarned: number;
  withdrawn:  number;
}

// ─────────────────────────────────────────
// PAYSTACK
// ─────────────────────────────────────────

export interface PaystackInitResponse {
  status:  boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code:       string;
    reference:         string;
  };
}

export interface PaystackTransferResponse {
  status:  boolean;
  message: string;
  data: {
    transfer_code: string;
    id:            number;
    status:        string;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference:  string;
    amount:     number;
    metadata?:  { orderId?: string; [key: string]: unknown };
    status:     string;
    customer:   { email: string };
    transfer_code?: string;
  };
}

// ─────────────────────────────────────────
// ORDER FORM (student placing an order)
// ─────────────────────────────────────────

export interface NewOrderPayload {
  planId:              string;
  topic:               string;
  department:          string;
  degreeGroup:         DegreeGroup;
  specialInstructions?: string;
  guidelineFileUrl?:   string;
  chaptersRequested?:  number[];  // [1,2,5] for selective chapter orders
}

// ─────────────────────────────────────────
// CHAPTER SUBMISSION (writer/analyst)
// ─────────────────────────────────────────

export interface ChapterSubmitPayload {
  chapterId:   string;
  fileUrl:     string;
  writerNotes?: string;
  // Chapter 1 prelim fields
  researchObjectives?: string;
  researchQuestions?:  string;
  hypotheses?:         string;
  scopeOfStudy?:       string;
}

// ─────────────────────────────────────────
// QC PAYLOADS
// ─────────────────────────────────────────

export interface QCClearPayload {
  chapterId:        string;
  clearedFileUrl:   string;
  plagiarismScore?: number;
  aiScore?:         number;
  qcNotes?:         string;
}

export interface QCEscalatePayload {
  chapterId:         string;
  escalationType:    "corrections" | "section_rewrite" | "full_rewrite";
  instructionsForWriter: string;
}

// ─────────────────────────────────────────
// WITHDRAWAL REQUEST
// ─────────────────────────────────────────

export interface WithdrawalRequestPayload {
  amountKobo:    number;
  bankName:      string;
  accountNumber: string;
  accountName:   string;
}
