/* src/app/globals.css */

/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Fonte */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Tema (tokens do Figma) */
:root {
  --font-size: 14px;

  --background: #0F1115;
  --foreground: #ffffff;

  --card: #161a22;
  --card-foreground: #ffffff;

  --popover: #161a22;
  --popover-foreground: #ffffff;

  --primary: #20D177;               /* Verde Qwip */
  --primary-foreground: #0F1115;

  --secondary: #2a3441;
  --secondary-foreground: #ffffff;

  --muted: #2a3441;
  --muted-foreground: #9ca3af;

  --accent: #FFC857;                /* Amarelo dos badges */
  --accent-foreground: #0F1115;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --border: rgba(255,255,255,0.10);
  --input: transparent;
  --input-background: #1f2937;
  --switch-background: #374151;

  --ring: #20D177;

  --radius: 0.625rem;               /* ~10px */

  --sidebar: #161a22;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #20D177;
  --sidebar-primary-foreground: #0F1115;
  --sidebar-accent: #2a3441;
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255,255,255,0.10);
  --sidebar-ring: #20D177;
}

.dark {
  --background: #0F1115;
  --foreground: #ffffff;

  --card: #161a22;
  --card-foreground: #ffffff;

  --popover: #161a22;
  --popover-foreground: #ffffff;

  --primary: #20D177;
  --primary-foreground: #0F1115;

  --secondary: #2a3441;
  --secondary-foreground: #ffffff;

  --muted: #2a3441;
  --muted-foreground: #9ca3af;

  --accent: #FFC857;
  --accent-foreground: #0F1115;

  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  --border: rgba(255,255,255,0.10);
  --input: #1f2937;

  --ring: #20D177;
}

/* Base */
@layer base {
  /* REMOVIDO: outline-ring/50 (não existe). Mantemos só a cor da borda global. */
  * { @apply border-border; }

  html { font-size: var(--font-size); }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    min-height: 100vh;
  }
}

/* Componentes utilitários usados no layout */
@layer components {
  /* Botão padrão da marca (CTA verde) */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-11
           font-semibold transition shadow-soft
           bg-primary text-primary-foreground hover:opacity-95
           focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
           active:shadow-glow;
  }

  /* Botão secundário (cinza escuro) */
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 h-11
           font-semibold transition
           bg-secondary text-secondary-foreground hover:opacity-95
           focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0;
  }

  /* Chip/badge arredondado */
  .chip {
    @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
           bg-muted text-muted-foreground border border-border;
  }

  /* Cartão padrão (seções, reviews etc) */
  .card {
    @apply rounded-2xl bg-card text-foreground border border-border
           shadow-[0_0_1px_rgba(255,255,255,0.06)];
  }

  /* Título super grande do herói */
  .hero-title {
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    font-size: clamp(2rem, 5vw, 3.5rem);
  }
}

/* Sombras especiais (glow suave do CTA) */
@layer utilities {
  .shadow-soft { box-shadow: 0 0 20px rgba(32, 209, 119, 0.15); }
  .shadow-glow { box-shadow: 0 0 24px rgba(32, 209, 119, 0.28); }
}

/* Animação opcional usada em alguns detalhes de fundo */
@keyframes gradient-x {
  0%,100% { transform: translateX(0%); }
  50% { transform: translateX(-100%); }
}
.animate-gradient-x { animation: gradient-x 15s ease infinite; }
