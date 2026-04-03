import { cn } from "@/lib/cn";

export function WireSection({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border border-dashed border-outline-variant/25 bg-surface-low/80 p-6",
        className,
      )}
    >
      <header className="mb-4">
        <h2 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-accent-ledger">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1 text-sm text-ink-secondary">{hint}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
