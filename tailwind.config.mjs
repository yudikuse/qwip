/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // paleta dark usada no Figma
        background: "#0B0F0E",   // canvas
        surface:    "#0F1514",   // cards
        border:     "#1C2422",
        primary:    "#00E6A8",   // green neon
        primary2:   "#13FFA7",
        text:       "#E7ECEB",
        textMuted:  "#8CA39E",
      },
      boxShadow: {
        card: "0 20px 60px rgba(0,0,0,0.45)",
        glow: "0 0 120px 20px rgba(19,255,167,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
    },
    fontFamily: {
      // Inter como default, combina com o Figma e evita bug de pacotes
      sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "Arial", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
  },
  plugins: [],
};
