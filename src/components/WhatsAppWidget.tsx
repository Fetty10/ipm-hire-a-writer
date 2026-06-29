"use client";
// src/components/WhatsAppWidget.tsx
// Floating WhatsApp chat bubble — links straight to Lina on WhatsApp.
// Drop this into any layout/page where students might need quick help.

const WHATSAPP_NUMBER = "2347051452411";
const DEFAULT_MESSAGE = "Hi Lina, I need help with my order on iProjectMaster.";

export function WhatsAppWidget({ message }: { message?: string }) {
  const text = encodeURIComponent(message || DEFAULT_MESSAGE);
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 999,
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(37,211,102,.4)",
        textDecoration: "none",
        transition: "transform .15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 3.5c-4.9 0-8.9 4-8.9 8.9 0 1.57.41 3.1 1.2 4.45L3.5 21l4.27-1.12a8.9 8.9 0 0 0 4.27 1.09h.01c4.9 0 8.9-4 8.9-8.9 0-2.38-.93-4.61-2.62-6.29zM12.05 19.4a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.74.75-2.73-.18-.28a7.4 7.4 0 0 1-1.13-3.94c0-4.08 3.33-7.4 7.41-7.4 1.98 0 3.84.77 5.24 2.17a7.34 7.34 0 0 1 2.17 5.24c0 4.08-3.33 7.4-7.42 7.4zm4.06-5.55c-.22-.11-1.32-.65-1.52-.73-.2-.07-.35-.11-.5.11-.15.22-.57.73-.7.88-.13.15-.26.16-.48.05-.22-.1-.93-.34-1.77-1.09-.65-.58-1.09-1.3-1.22-1.52-.13-.22-.01-.34.1-.46.1-.1.22-.27.33-.4.11-.13.15-.23.22-.38.07-.15.04-.28-.02-.39-.07-.11-.5-1.21-.69-1.65-.18-.43-.37-.37-.5-.38-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.2.22-.78.76-.78 1.86 0 1.1.8 2.16.91 2.31.11.15 1.53 2.34 3.72 3.18 1.85.71 2.22.58 2.62.54.4-.04 1.3-.53 1.48-1.04.18-.51.18-.94.13-1.04-.05-.1-.2-.16-.42-.27z"/>
      </svg>
    </a>
  );
}
