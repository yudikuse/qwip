/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores do Figma
        brand: {
          DEFAULT: "#16C784",   // verde principal (botões / destaques)
          600: "#12B676",
          700: "#0FA66B",
        },
        zincglass: "rgba(255,255,255,0.06)", // cards em dark
        card: "#0E1412",
        page: "#0B0F0E",
      },
      boxShadow: {
        soft: "0 10px 24px -8px rgba(0,0,0,.45)",
        glow: "0 0 0 8px rgba(22,199,132,.15)",
      },
      borderRadius: {
        xl2: "16px",
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        herosm: ["44px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      },
      container: {
        center: true,
        padding: { DEFAULT: "1rem", lg: "2rem" },
      },
    },
    fontFamily: {
      // usa as vars do pacote `geist`
      sans: ["var(--font-geist-sans)", "system-ui", "Inter", "Arial", "sans-serif"],
      mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
    },
  },
  plugins: [],
};
