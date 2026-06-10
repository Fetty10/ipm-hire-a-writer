// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          50:   "#F0F9FF",
          100:  "#E0F2FE",
          200:  "#BAE6FD",
          300:  "#7DD3FC",
          400:  "#38BDF8",
          500:  "#0EA5E9",
          600:  "#0284C7",
          700:  "#0369A1",
          800:  "#075985",
          900:  "#0C4A6E",
        },
        navy: {
          DEFAULT: "#0C1A2E",
          mid:     "#102339",
          soft:    "#16304D",
          muted:   "#5B7EA6",
        },
      },
      fontFamily: {
        clash:   ["Clash Display", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
        sans:    ["Satoshi", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:       "0 4px 24px rgba(14,165,233,0.10)",
        "card-hover": "0 12px 40px rgba(14,165,233,0.18)",
        glow:       "0 0 0 3px rgba(56,189,248,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
