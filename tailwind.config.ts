import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#131313",
          sidebar: "#0e0e0e",
          card: "#201f1f",
          low: "#1c1b1b",
          high: "#2a2a2a",
          highest: "#353534",
        },
        ink: {
          DEFAULT: "#ffffff",
          secondary: "rgba(255, 255, 255, 0.72)",
          muted: "rgba(255, 255, 255, 0.4)",
        },
        accent: {
          ledger: "#EFFF00",
          "on-ledger": "#1b1d00",
          magenta: "#FF007F",
          pink: "#ffb1c4",
          blue: "#93c5fd",
          "blue-soft": "rgba(147, 197, 253, 0.12)",
          green: "#86efac",
          "green-soft": "rgba(134, 239, 172, 0.12)",
          coral: "#fb923c",
          "coral-soft": "rgba(251, 146, 60, 0.12)",
          violet: "#c4b5fd",
          "violet-soft": "rgba(196, 181, 253, 0.12)",
        },
        outline: {
          DEFAULT: "#929277",
          variant: "#474832",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        headline: [
          "var(--font-space-grotesk)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "0",
        "card-lg": "0",
      },
      boxShadow: {
        card: "none",
        "card-hover": "none",
      },
      spacing: {
        "18": "4.5rem",
        sidebar: "18rem",
      },
      maxWidth: {
        content: "100rem",
        prose: "40rem",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
