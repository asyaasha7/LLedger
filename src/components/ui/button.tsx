import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-ledger text-accent-on-ledger font-headline font-bold uppercase tracking-widest text-xs hover:opacity-90 active:scale-[0.99]",
  secondary:
    "border border-outline-variant/40 bg-transparent font-headline font-bold uppercase tracking-widest text-xs text-ink hover:border-ink",
  ghost:
    "text-ink-secondary hover:bg-surface-card hover:text-ink active:scale-[0.99]",
  destructive:
    "border border-accent-magenta/40 bg-transparent font-headline font-bold uppercase tracking-widest text-xs text-accent-magenta hover:border-accent-magenta",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 min-h-[44px] items-center justify-center px-5 text-sm transition-all duration-200 ease-soft disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
