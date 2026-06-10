// src/lib/upload.ts
// Cloudinary file upload helper for writer/analyst/QC chapter submissions
// Accepts PDF and DOCX only, max 20MB

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:     process.env.CLOUDINARY_API_KEY!,
  api_secret:  process.env.CLOUDINARY_API_SECRET!,
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export type UploadFolder =
  | "chapters/submitted"       // writer/analyst first upload
  | "chapters/qc-cleared"      // QC-cleared version
  | "chapters/delivered"       // final delivered to student
  | "chapters/corrections"     // correction uploads
  | "staff/cv"                 // staff CV uploads
  | "staff/samples"            // staff work sample uploads
  | "orders/guidelines"        // student-uploaded format/guideline
  | "orders/supervisor-notes"; // student-uploaded supervisor correction notes

export interface UploadResult {
  url:       string;
  publicId:  string;
  fileName:  string;
  sizeBytes: number;
  format:    string;
}

/**
 * Upload a Buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer:   Buffer,
  fileName: string,
  folder:   UploadFolder
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:     sanitizeFileName(fileName),
        resource_type: "raw", // treats PDF/DOCX as raw files
        use_filename:  true,
        unique_filename: true,
        access_mode:   "authenticated", // signed URLs only — no public access
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve({
          url:       result.secure_url,
          publicId:  result.public_id,
          fileName,
          sizeBytes: result.bytes,
          format:    result.format,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Generate a short-lived signed URL for secure download
 * (so students/staff can only download files they're authorised for)
 */
export function generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    sign_url:      true,
    expires_at:    Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

/**
 * Delete a file from Cloudinary (e.g. when a chapter is reassigned)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

// ── Helpers ──────────────────────────────────────────────────
function sanitizeFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")           // remove extension
    .replace(/[^a-zA-Z0-9_-]/g, "_")  // replace special chars
    .slice(0, 60);                      // max length
}
