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

export const ADMIN_LEGACY_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export type UploadFolder =
  | "chapters/submitted"
  | "chapters/qc-cleared"
  | "chapters/delivered"
  | "chapters/corrections"
  | "staff/cv"
  | "staff/samples"
  | "orders/guidelines"
  | "orders/supervisor-notes"
  | "orders/corrections"
  | "admin/legacy-files";

export interface UploadResult {
  url:       string;
  publicId:  string;
  fileName:  string;
  sizeBytes: number;
  format:    string;
}

/**
 * Map a MIME type to its correct file extension.
 * Critical: Cloudinary's "raw" resource type needs the extension preserved
 * in the public_id so the served URL has the right extension, otherwise
 * browsers default to text/plain when downloading.
 */
function mimeToExt(mime: string, originalName: string): string {
  const map: Record<string,string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/webm": "webm",
    "video/webm": "webm",
  };
  if (map[mime]) return map[mime];
  // Fallback: try to infer from original filename
  const fromName = originalName.split(".").pop()?.toLowerCase();
  return fromName || "bin";
}

/**
 * Upload a Buffer to Cloudinary, preserving the correct file extension
 * so downloads always have the right type and open correctly.
 */
export async function uploadToCloudinary(
  buffer:   Buffer,
  fileName: string,
  folder:   UploadFolder,
  mimeType?: string
): Promise<UploadResult> {
  const ext = mimeType ? mimeToExt(mimeType, fileName) : (fileName.split(".").pop()?.toLowerCase() || "bin");
  const baseName = sanitizeFileName(fileName);
  const publicIdWithExt = `${baseName}.${ext}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id:       publicIdWithExt,
        resource_type:   "raw",
        use_filename:    false, // we set public_id explicitly with extension
        unique_filename: true,
        access_mode:     "authenticated",
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
          format:    ext,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Generate a short-lived signed URL for secure download with a custom
 * display filename via Cloudinary's `fl_attachment` flag.
 */
export function generateSignedUrl(
  publicId: string,
  expiresInSeconds = 3600,
  downloadFileName?: string
): string {
  return cloudinary.url(publicId, {
    resource_type: "raw",
    sign_url:      true,
    expires_at:    Math.floor(Date.now() / 1000) + expiresInSeconds,
    flags:         downloadFileName ? `attachment:${encodeURIComponent(downloadFileName)}` : "attachment",
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

// ── Helpers ──────────────────────────────────────────────────
function sanitizeFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
}
