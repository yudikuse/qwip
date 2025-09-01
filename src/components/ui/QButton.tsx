"use client";

import Link from "next/link";
import { cn } from "@/lib/utils"; // se não tiver, troque por (a || b). Veja nota abaixo.
import { Sparkles, Eye } from "lucide-react";
import React from "react";

type Variant = "primary" | "outline";

type Props = {
  href: string;
  children?: React.ReactNode;
  icon?: "sparkles" | "eye";
  variant?: Variant;
  className?: string;
  title?: string;
};

const icons = {
  sparkles: Sparkles,
  eye: Eye,
};

export default function QButton({
  href,
  children,
  icon = "sparkles",
  variant = "primary",
  className,
  title,
}: Props) {
  const Icon = icons[icon];

  const base =
    "group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";

  const primary =
    "bg-emerald-500 text-black shadow-[0_6px_24px_rgba(16,185,129,.25)] hover:bg-emerald-400 active:translate-y-[1px]";

  const outline =
    "bg-white/5 text-white border border-emerald-400/35 hover:border-emerald-400/70 hover:bg-white/8 backdrop-blur-[2px] active:translate-y-[1px]";

  return (
    <Link
      href={href}
      aria-label={typeof children === "string" ? children : title}
      title={title}
      className={cn(base, variant === "primary" ? primary : outline, className)}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] transition-transform",
          variant === "primary" ? "text-black" : "text-emerald-300"
        )}
      />
      <span>{children}</span>
      {/* leve brilho ao passar o mouse */}
      <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-emerald-400/20" />
    </Link>
  );
}

/**
 * NOTA caso não tenha a função `cn`:
 *   substitua `cn(a,b,c)` por `[a,b,c].filter(Boolean).join(" ")`
 */
