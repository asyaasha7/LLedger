import { cn } from "@/lib/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

/**
 * Repeated “eyebrow + title + subtitle” stack for list and form pages.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(className)}>
      {eyebrow ? (
        <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-headline text-3xl font-black uppercase tracking-tighter text-ink">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-lg text-sm text-ink-secondary">{description}</p>
      ) : null}
    </header>
  );
}
