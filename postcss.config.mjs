export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0C0E10",
        foreground: "#E6F4EF",
        primary: "#16C981",
        grayfgg: "#9AA8AA",
      },
      fontFamily: {
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
