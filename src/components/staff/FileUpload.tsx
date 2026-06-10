"use client";
// src/components/staff/FileUpload.tsx
// Reusable drag-and-drop file upload component
// Uploads to /api/upload then calls onUpload(url) with the Cloudinary URL

import { useState, useRef, useCallback } from "react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import type { UploadFolder } from "@/lib/upload";

interface FileUploadProps {
  folder:       UploadFolder;
  onUpload:     (url: string, fileName: string) => void;
  accept?:      string;
  label?:       string;
  disabled?:    boolean;
  existingUrl?: string;
  className?:   string;
}

export function FileUpload({
  folder,
  onUpload,
  accept    = ".pdf,.doc,.docx",
  label     = "Upload File",
  disabled  = false,
  existingUrl,
  className,
}: FileUploadProps) {
  const [uploading,    setUploading]    = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate type
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowed.includes(file.type)) {
        toast.error("Only PDF and Word (.docx) files are allowed.");
        return;
      }

      // Validate size
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must not exceed 20MB.");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file",   file);
        formData.append("folder", folder);

        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.error || "Upload failed.");
          return;
        }

        setUploadedName(data.fileName || file.name);
        onUpload(data.url, data.fileName || file.name);
        toast.success("File uploaded successfully.");
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onUpload]
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const uploaded = !!uploadedName || !!existingUrl;

  return (
    <div className={clsx("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all",
          isDragging
            ? "border-sky-400 bg-sky-50"
            : uploaded
            ? "border-green-300 bg-green-50"
            : "border-sky-200 bg-sky-50/50 hover:border-sky-400 hover:bg-sky-50",
          (disabled || uploading) && "opacity-60 cursor-not-allowed"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm text-navy-muted font-500">Uploading...</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl">✅</div>
            <p className="text-sm font-600 text-green-700">
              {uploadedName || "File uploaded"}
            </p>
            <p className="text-xs text-green-600">
              Tap to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl">📄</div>
            <p className="text-sm text-navy-DEFAULT font-600">{label}</p>
            <p className="text-xs text-navy-muted">
              Drag & drop or <span className="text-sky-600 font-600">browse</span>
            </p>
            <p className="text-xs text-navy-muted">PDF or Word (.docx) · Max 20MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
