"use client";

import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "lg" | "md" | "sm";

type QButtonProps = {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-shadow " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<Size, string> = {
  lg: "h-12 px-5 text-base",
  md: "h-10 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
};

const variants: Record<Variant, string> = {
  solid:
    "bg-emerald-500 text-black shadow-[0_8px_18px_rgba(16,185,129,.35)] hover:bg-emerald-400",
  outline:
    "border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  ghost: "text-emerald-300 hover:bg-emerald-500/10",
};

export default function QButton({
  href,
  onClick,
  type = "button",
  variant = "solid",
  size = "lg",
  icon,
  className,
  children,
}: QButtonProps) {
  const cls = cn(base, sizes[size], variants[variant], className);
  const content = (
    <>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls}>
      {content}
    </button>
  );
}
