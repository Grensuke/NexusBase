/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        border: "#D9E0E8",
        input: "#D9E0E8",
        ring: "#4556D8",
        background: "#F7F8FA",
        foreground: "#111827",
        surface: "#FFFFFF",
        "muted-surface": "#F1F4F8",
        "primary-ink": "#111827",
        "secondary-ink": "#475467",
        "muted-text": "#667085",
        "strong-border": "#C7D0DC",
        cobalt: {
          DEFAULT: "#4556D8",
          dark: "#3545BE",
          soft: "#EEF0FF",
        },
        verified: {
          DEFAULT: "#13795B",
          soft: "#EAF7F1",
        },
        warning: {
          DEFAULT: "#B7791F",
          soft: "#FFF7E6",
        },
        violated: {
          DEFAULT: "#B54747",
          soft: "#FDEEEE",
        },
        unknown: {
          DEFAULT: "#667085",
          soft: "#F2F4F7",
        },
        primary: {
          DEFAULT: "#4556D8",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#475467",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#B54747",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F4F8",
          foreground: "#667085",
        },
        accent: {
          DEFAULT: "#EEF0FF",
          foreground: "#4556D8",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
}
