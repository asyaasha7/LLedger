import Link from "next/link";
import { BarChart3, FileText, AlertTriangle } from "lucide-react";
import { routes } from "@/config/routes";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  listLeaseCases,
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { formatMoney } from "@/lib/format-money";
import { StatusPill } from "@/components/ui/status-pill";
import { WireSection } from "@/components/wireframe/wire-section";
import { EmptyState } from "@/components/wireframe/empty-state";
import { cn } from "@/lib/cn";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const cases =
    isDatabaseConfigured() && user
      ? await listLeaseCasesForUser(user.id)
      : await listLeaseCases();
  const hasCases = cases.length > 0;

  if (!hasCases) {
    return (
      <EmptyState
        headline="No lease cases yet"
        text="Create your first case to start recording evidence and deposit workflow"
        ctaLabel="Create Case"
        ctaHref={routes.newCase}
      />
    );
  }

  const activeCases = cases.length;
  const pendingReviews = 1;
  const atRisk = 0;

  const totalDeposit = cases.reduce((s, c) => s + c.depositCents, 0);

  return (
    <div className="space-y-16 lg:space-y-24">
      <section className="flex flex-col items-end justify-between gap-10 md:flex-row">
        <div className="max-w-4xl">
          <span className="mb-6 block font-headline text-xs font-bold uppercase tracking-[0.3em] text-accent-ledger">
            Current portfolio status
          </span>
          <h2 className="text-display-lg uppercase text-ink">Registry.</h2>
        </div>
        <div className="max-w-xs pb-2 text-right md:pb-6">
          <p className="text-sm leading-relaxed text-ink-muted">
            Private evidence, structured review, and settlement with an immutable
            Hedera-backed timeline. Updated{" "}
            <span className="text-ink">moments ago</span>.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4">
        <div className="relative col-span-12 flex min-h-[22rem] flex-col justify-between overflow-hidden border border-outline-variant/15 bg-surface-low p-8 sm:p-12 lg:col-span-8">
          <div className="absolute right-0 top-0 p-8">
            <BarChart3
              className="h-10 w-10 text-accent-ledger/20 transition-colors group-hover:text-accent-ledger"
              strokeWidth={1}
              aria-hidden
            />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
              Total deposits held
            </span>
            <div className="mt-4 flex flex-wrap items-baseline gap-4">
              <span className="text-headline-lg text-ink">
                {formatMoney(totalDeposit)}
              </span>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-10 overflow-x-auto no-scrollbar">
            <div className="shrink-0">
              <span className="block text-[10px] uppercase tracking-widest text-ink-muted">
                Active cases
              </span>
              <span className="block font-headline text-2xl font-bold tabular-nums">
                {String(activeCases).padStart(2, "0")}
              </span>
            </div>
            <div className="shrink-0">
              <span className="block text-[10px] uppercase tracking-widest text-ink-muted">
                Pending review
              </span>
              <span className="block font-headline text-2xl font-bold tabular-nums">
                {String(pendingReviews).padStart(2, "0")}
              </span>
            </div>
            <div className="shrink-0">
              <span className="block text-[10px] uppercase tracking-widest text-ink-muted">
                At risk
              </span>
              <span className="block font-headline text-2xl font-bold tabular-nums text-accent-magenta">
                {String(atRisk).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 flex min-h-[22rem] flex-col justify-center gap-6 border border-outline-variant/15 bg-surface-card p-8 sm:p-12 lg:col-span-4">
          <div className="relative h-1 w-full bg-white/5">
            <div className="absolute left-0 top-0 h-full w-[70%] bg-accent-ledger" />
          </div>
          <div>
            <h4 className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-ink-muted">
              Workflow health
            </h4>
            <span className="font-headline text-5xl font-bold italic text-ink">
              92%
            </span>
          </div>
          <p className="text-xs leading-relaxed text-ink-secondary">
            Cases with evidence on file and clear next actions stay on track.
          </p>
          <Link
            href={routes.casesList}
            className="self-start border-b border-accent-ledger pb-1 font-headline text-xs font-bold uppercase tracking-widest text-accent-ledger"
          >
            View all cases
          </Link>
        </div>

        <div className="col-span-12">
          <div className="border border-outline-variant/15 bg-surface-low">
            <div className="grid grid-cols-12 border-b border-surface px-6 py-6 sm:px-12">
              <div className="col-span-12 text-[10px] font-bold uppercase tracking-widest text-ink-muted sm:col-span-4">
                Property / case
              </div>
              <div className="hidden text-center text-[10px] font-bold uppercase tracking-widest text-ink-muted sm:col-span-3 sm:block">
                Status
              </div>
              <div className="hidden text-center text-[10px] font-bold uppercase tracking-widest text-ink-muted sm:col-span-3 sm:block">
                Lease end
              </div>
              <div className="hidden text-right text-[10px] font-bold uppercase tracking-widest text-ink-muted sm:col-span-2 sm:block">
                Actions
              </div>
            </div>
            {cases.map((c) => (
              <Link
                key={c.leaseId}
                href={routes.case(c.leaseId).overview}
                className="grid grid-cols-12 items-center gap-4 px-6 py-8 transition-colors hover:bg-surface-card sm:gap-0 sm:px-12 sm:py-10"
              >
                <div className="col-span-12 sm:col-span-4">
                  <span className="block font-headline text-lg font-bold text-ink transition-colors group-hover:text-accent-ledger">
                    {c.propertyRef}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase text-ink-muted">
                    {c.leaseRef}
                  </span>
                </div>
                <div className="col-span-12 flex sm:col-span-3 sm:justify-center">
                  <StatusPill status={c.status} />
                </div>
                <div className="col-span-12 font-headline text-sm text-ink-secondary sm:col-span-3 sm:text-center">
                  {c.lease.end}
                </div>
                <div className="col-span-12 flex justify-end sm:col-span-2">
                  <span className="text-ink-muted transition-colors hover:text-ink">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <div>
          <h3 className="mb-10 font-headline text-3xl font-black uppercase leading-tight tracking-tighter text-ink sm:text-4xl">
            Recent
            <br />
            activity.
          </h3>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-surface-card">
                <FileText
                  className="h-5 w-5 text-accent-ledger"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="font-medium text-ink">
                  Evidence ready for review —{" "}
                  <span className="text-accent-ledger">Unit 4B</span>
                </p>
                <span className="text-xs uppercase tracking-widest text-ink-muted">
                  Today · Evidence vault
                </span>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-surface-card">
                <AlertTriangle
                  className="h-5 w-5 text-accent-magenta"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="font-medium text-ink">
                  Follow-up suggested —{" "}
                  <span className="text-accent-magenta">12 Oak Street</span>
                </p>
                <span className="text-xs uppercase tracking-widest text-ink-muted">
                  Yesterday · Deposit escrow
                </span>
              </div>
            </div>
          </div>
        </div>

        <WireSection
          title="Next steps"
          hint="What needs attention across your portfolio"
          className="border-solid"
        >
          <ul className="space-y-3 text-sm text-ink-secondary">
            <li className="flex justify-between gap-4 border-b border-outline-variant/10 py-3">
              <span>Settlement proposal — Unit 4B</span>
              <span className="shrink-0 text-ink-muted">Today</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-outline-variant/10 py-3">
              <span>Move-out evidence — 12 Oak Street</span>
              <span className="shrink-0 text-ink-muted">Yesterday</span>
            </li>
          </ul>
        </WireSection>
      </section>

      <div className="flex justify-center">
        <Link
          href={routes.newCase}
          className={cn(
            "inline-flex h-12 items-center justify-center bg-accent-ledger px-8 font-headline text-xs font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90",
          )}
        >
          Create new case
        </Link>
      </div>
    </div>
  );
}
