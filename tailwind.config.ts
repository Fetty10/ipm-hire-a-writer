import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0C1A2E",
          mid: "#112240",
          muted: "#5B7EA6",
        },
        sky: {
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
          light: "#BAE6FD",
          pale:  "#F0F9FF",
          dark:  "#0284C7",
          deep:  "#0369A1",
        },
      },
      fontFamily: {
        clash:   ["Syne", "sans-serif"],
        satoshi: ["DM Sans", "sans-serif"],
      },
      fontWeight: {
        "500": "500",
        "600": "600",
        "700": "700",
        "800": "800",
      },
      boxShadow: {
        card:       "0 2px 12px rgba(14,165,233,0.06)",
        "card-hover": "0 8px 24px rgba(14,165,233,0.12)",
        glow:       "0 0 0 3px rgba(56,189,248,0.3)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  safelist: [
    // Navy colors
    "text-navy-DEFAULT", "text-navy-mid", "text-navy-muted",
    "bg-navy-DEFAULT", "bg-navy-mid",
    "border-navy-DEFAULT", "border-navy-mid",
    // Sky custom
    "text-sky-deep", "text-sky-dark", "text-sky-light",
    "bg-sky-pale", "bg-sky-light",
    "border-sky-light",
    // Font family
    "font-clash", "font-satoshi",
    // Font weights
    "font-500", "font-600", "font-700", "font-800",
    // Shadows
    "shadow-card", "shadow-card-hover", "shadow-glow",
    // Tracking
    "tracking-tight",
  ],
  plugins: [],
};

export default config;
