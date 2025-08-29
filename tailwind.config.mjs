// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0C0E10",
        foreground: "#E6F4EF",
        primary: "#16C981",
        primaryFg: "#0A0A0A",
      },
      fontFamily: {
        // usa as CSS vars fornecidas pelo pacote `geist`
        sans: ["var(--font-geist-sans)", "system-ui", "Inter", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", lg: "2rem" },
      },
    },
  },
  plugins: [],
};
