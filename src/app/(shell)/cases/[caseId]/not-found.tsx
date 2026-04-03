import Link from "next/link";
import { routes } from "@/config/routes";

export default function CaseNotFound() {
  return (
    <div className="border border-outline-variant/20 bg-surface-card p-10 text-center">
      <h1 className="font-headline text-lg font-bold text-ink">Case not found</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        This lease case does not exist or was removed.
      </p>
      <Link
        href={routes.dashboard}
        className="mt-6 inline-flex h-11 items-center justify-center bg-accent-ledger px-6 font-headline text-[10px] font-bold uppercase tracking-widest text-accent-on-ledger hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
