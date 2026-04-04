import Link from "next/link";
import { cn } from "@/lib/cn";

export function EmptyState({
  headline,
  text,
  ctaLabel,
  ctaHref,
  className,
}: {
  headline: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-outline-variant/20 bg-surface-card px-8 py-16 text-center",
        className,
      )}
    >
      <h2 className="font-headline text-lg font-semibold tracking-tight text-ink">
        {headline}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-secondary">
        {text}
      </p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-8 inline-flex h-11 min-h-[44px] items-center justify-center bg-accent-ledger px-6 font-headline text-xs font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
