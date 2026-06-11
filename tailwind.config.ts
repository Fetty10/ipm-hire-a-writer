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
          light: "#BAE6FD",
          pale: "#F0F9FF",
          dark: "#0284C7",
          deep: "#0369A1",
        },
      },
      fontFamily: {
        clash: ["Syne", "sans-serif"],
        satoshi: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(14,165,233,0.06)",
        "card-hover": "0 8px 24px rgba(14,165,233,0.12)",
        glow: "0 0 0 3px rgba(56,189,248,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
