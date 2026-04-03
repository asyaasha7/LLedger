import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { routes } from "@/config/routes";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { getSettlementForLease } from "@/server/repos/settlements.repo";
import { listDeductionProposalsForLease } from "@/server/repos/deduction-proposals.repo";
import type { Settlement } from "@/domain";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { refundAmountCents } from "@/lib/money";

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseForRequest(caseId);
  if (!c) notFound();

  const existing = await getSettlementForLease(caseId);
  const settlement: Settlement =
    existing ?? {
      settlementId: `set-${caseId}-draft`,
      leaseId: caseId,
      depositAmountCents: c.depositCents,
      deductionAmountCents: 40_000,
      refundAmountCents: refundAmountCents(c.depositCents, 40_000),
      status: "DRAFT",
      approvedByTenant: false,
      approvedByLandlord: false,
      hederaScheduleId: null,
      createdAt: new Date().toISOString(),
    };

  const deposit = settlement.depositAmountCents;
  const deduction = settlement.deductionAmountCents;
  const refund = refundAmountCents(deposit, deduction);
  const settlementComplete = settlement.status === "EXECUTED";

  const overviewHref = routes.case(caseId).overview;
  const proposals = await listDeductionProposalsForLease(caseId);
  const activeDeduction = proposals.find((p) => p.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-6xl space-y-16">
      <header className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="border border-outline-variant/30 bg-surface-card px-3 py-1 font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
              Case · {c.leaseRef}
            </span>
            <span className="bg-accent-ledger px-3 py-1 font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-on-ledger">
              Settlement
            </span>
          </div>
          <h1 className="font-headline text-5xl font-black uppercase leading-[0.85] tracking-tighter text-ink sm:text-7xl md:text-8xl">
            Final
            <br />
            settlement<span className="text-accent-ledger">.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
            {c.propertyRef} — deposit, deductions, and refund in one view.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between border border-outline-variant/15 bg-surface-low p-8 lg:col-span-7 lg:p-12">
          <div>
            <h2 className="mb-10 font-headline text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">
              Transaction breakdown
            </h2>
            <div className="space-y-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="block font-headline text-xl font-medium uppercase tracking-tight text-ink sm:text-2xl">
                    Original deposit
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-widest text-ink-muted">
                    Held in escrow for this lease
                  </span>
                </div>
                <div className="font-headline text-3xl font-bold tabular-nums text-ink sm:text-4xl">
                  {formatMoney(deposit)}
                </div>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="block font-headline text-xl font-medium uppercase tracking-tight text-accent-magenta sm:text-2xl">
                    Deductions
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-widest text-ink-muted">
                    Linked to move-out evidence
                  </span>
                </div>
                <div className="font-headline text-3xl font-bold tabular-nums text-accent-magenta sm:text-4xl">
                  −{formatMoney(deduction)}
                </div>
              </div>
              <div className="h-px w-full bg-outline-variant/20" />
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="mb-2 block font-headline text-xs font-bold uppercase tracking-[0.3em] text-accent-ledger">
                    Closing balance
                  </span>
                  <span className="block font-headline text-2xl font-black uppercase tracking-tighter text-ink sm:text-4xl">
                    Refund to tenant
                  </span>
                </div>
                <div className="font-headline text-5xl font-black tracking-tighter text-accent-ledger sm:text-7xl">
                  {formatMoney(refund)}
                </div>
              </div>
            </div>
          </div>

          {!settlementComplete ? (
            <div className="mt-12 flex flex-wrap gap-4 border-t border-outline-variant/20 pt-10">
              <Button variant="primary" className="px-8">
                Approve settlement
              </Button>
              <Button variant="destructive" className="px-8">
                Reject
              </Button>
              <Button variant="secondary" className="px-8">
                Schedule refund
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col border border-outline-variant/15 bg-surface-card lg:col-span-5">
          <div className="border-b border-outline-variant/15 p-8 lg:p-10">
            <h3 className="mb-6 font-headline text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">
              Supporting details
            </h3>
            <p className="text-sm leading-relaxed text-ink-secondary">
              {activeDeduction
                ? `Deduction reason: ${activeDeduction.reason}`
                : "No active deduction proposal on file."}
            </p>
            {activeDeduction ? (
              <ul className="mt-4 space-y-1 text-sm text-ink-secondary">
                {activeDeduction.linkedEvidenceIds.map((id) => (
                  <li key={id}>· Linked evidence: {id}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-4 text-xs text-ink-muted">
              Tenant: {settlement.approvedByTenant ? "Approved" : "Pending"} ·
              Landlord: {settlement.approvedByLandlord ? "Approved" : "Pending"}
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-between p-8 lg:p-10">
            <div>
              <h3 className="mb-6 font-headline text-xs font-bold uppercase tracking-[0.3em] text-ink-muted">
                Checklist
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <CheckCircle
                    className="h-5 w-5 shrink-0 text-accent-ledger"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-headline text-sm font-bold uppercase tracking-wide text-ink">
                      Evidence on file
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Move-in and move-out documented.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <AlertTriangle
                    className="h-5 w-5 shrink-0 text-accent-magenta"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-headline text-sm font-bold uppercase tracking-wide text-accent-magenta">
                      Signature pending
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Tenant sign-off to close.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {settlementComplete ? (
        <section className="border border-emerald-500/30 bg-emerald-500/5 p-10 text-center">
          <p className="font-headline text-sm font-bold uppercase tracking-widest text-emerald-400">
            Refund complete
          </p>
          <p className="mt-2 font-headline text-4xl font-black tabular-nums text-ink">
            {formatMoney(refund)}
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Ref · ACH-204481 · Apr 8, 2026
          </p>
        </section>
      ) : null}

      <Link
        href={overviewHref}
        className="inline-flex font-headline text-xs font-bold uppercase tracking-widest text-accent-ledger hover:underline"
      >
        ← Back to case
      </Link>
    </div>
  );
}
