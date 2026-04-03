import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendingUp, User } from "lucide-react";
import { routes } from "@/config/routes";
import { InviteTenantForm } from "@/components/case/invite-tenant-form";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import { getLeaseCaseForRequest } from "@/server/lease-case-view";
import { getMembershipRole } from "@/server/repos/case-memberships.repo";
import { getSettlementForLease } from "@/server/repos/settlements.repo";
import { CASE_REGISTRY_HERO_IMAGE } from "@/lib/design-assets";
import { getCasePrimaryAction } from "@/lib/case-actions";
import { formatMoney } from "@/lib/format-money";
import { refundAmountCents } from "@/lib/money";
import { CASE_WORKFLOW_STAGES } from "@/domain";
import { StatusPill } from "@/components/ui/status-pill";
import { WireSection } from "@/components/wireframe/wire-section";

export default async function CaseOverviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const c = await getLeaseCaseForRequest(caseId);
  if (!c) notFound();

  const user = await getSessionUser();
  const membershipRole =
    isDatabaseConfigured() && user
      ? await getMembershipRole(caseId, user.id)
      : null;
  const showTenantInvite =
    Boolean(isDatabaseConfigured()) &&
    membershipRole === "landlord" &&
    c.tenant.userId === "pending";

  const primaryCta = getCasePrimaryAction(c);
  const settlementPreview = await getSettlementForLease(caseId);
  const deductionCents =
    settlementPreview?.deductionAmountCents ?? 40_000;
  const refundPreview = refundAmountCents(c.depositCents, deductionCents);
  const caseRoutes = routes.case(c.leaseId);

  return (
    <div className="space-y-4">
      <section className="relative grid min-h-[22rem] gap-0 overflow-hidden bg-surface p-8 sm:min-h-[26rem] sm:p-12 lg:grid-cols-12 lg:p-16">
        <div className="relative z-10 lg:col-span-8">
          <nav className="mb-8 flex flex-wrap items-center gap-2">
            <span className="font-headline text-[10px] uppercase tracking-[0.2em] text-accent-ledger">
              Active case
            </span>
            <span className="h-px w-10 bg-outline-variant/40" aria-hidden />
            <span className="font-headline text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              Registry ID: {c.leaseRef}
            </span>
          </nav>
          <h1 className="font-headline text-5xl font-black uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl md:text-8xl">
            {c.propertyRef.toUpperCase()}
            <br />
            <span className="text-accent-ledger">{c.leaseRef.toUpperCase()}</span>
            <span className="text-ink">.</span>
          </h1>
          <div className="mt-12 flex flex-wrap gap-10">
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
                Status
              </p>
              <div className="mt-2">
                <StatusPill status={c.status} />
              </div>
            </div>
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
                Deposit
              </p>
              <p className="mt-1 font-headline text-3xl font-bold tracking-tighter text-ink sm:text-4xl">
                {formatMoney(c.depositCents)}
              </p>
            </div>
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
                Next action
              </p>
              <p className="mt-1 max-w-xs font-headline text-lg font-bold text-ink">
                {c.nextAction}
              </p>
            </div>
          </div>
          <Link
            href={primaryCta.href}
            className="mt-10 inline-flex h-12 items-center justify-center bg-accent-ledger px-8 font-headline text-[10px] font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90"
          >
            {primaryCta.label}
          </Link>
        </div>
        <div
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-[38%] max-w-md lg:block"
          aria-hidden
        >
          <div className="relative h-full min-h-[20rem] w-full">
            <Image
              src={CASE_REGISTRY_HERO_IMAGE}
              alt="Minimal interior architecture, grayscale reference from design prototype"
              fill
              className="object-cover object-center grayscale contrast-125"
              sizes="(min-width: 1024px) 400px, 0px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-ledger" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-8 border border-outline-variant/15 bg-surface-card p-8 sm:p-10 md:col-span-2">
          <div className="flex items-start justify-between">
            <span className="font-headline text-[10px] uppercase tracking-widest text-accent-ledger">
              01 / Parties
            </span>
            <User className="h-5 w-5 text-ink-muted" strokeWidth={1.5} />
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
                Tenant
              </p>
              <p className="mt-3 font-headline text-2xl font-bold leading-tight text-ink">
                {c.tenant.displayName}
              </p>
            </div>
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
                Landlord
              </p>
              <p className="mt-3 font-headline text-2xl font-bold leading-tight text-ink">
                {c.landlord.displayName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between border border-outline-variant/15 bg-surface-low p-8 sm:p-10">
          <span className="font-headline text-[10px] uppercase tracking-widest text-ink-muted">
            02 / Term
          </span>
          <div>
            <p className="font-headline text-4xl font-bold text-ink">—</p>
            <p className="mt-2 font-headline text-[10px] uppercase tracking-widest text-ink-muted">
              Lease window
            </p>
          </div>
          <div className="mt-8 border-t border-outline-variant/15 pt-4">
            <p className="text-xs font-medium text-ink-secondary">
              Start: {c.lease.start}
            </p>
            <p className="text-xs font-medium text-ink-secondary">
              End: {c.lease.end}
            </p>
          </div>
        </div>

        <div className="flex cursor-pointer flex-col justify-between border border-outline-variant/15 bg-accent-ledger p-8 transition-opacity hover:opacity-90 sm:p-10">
          <div className="flex justify-between">
            <span className="font-headline text-[10px] uppercase tracking-widest text-accent-on-ledger">
              03 / At a glance
            </span>
            <TrendingUp
              className="h-5 w-5 text-accent-on-ledger"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="font-headline text-4xl font-black tracking-tighter text-accent-on-ledger sm:text-5xl">
              On track
            </p>
            <p className="mt-2 font-headline text-[10px] uppercase tracking-widest text-accent-on-ledger/70">
              Evidence & settlement
            </p>
          </div>
        </div>
      </section>

      {showTenantInvite ? (
        <section className="border border-accent-ledger/25 bg-surface-card p-8 sm:p-10">
          <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
            Tenant access
          </p>
          <h2 className="mt-2 font-headline text-xl font-black uppercase tracking-tighter text-ink">
            Invite tenant to this case
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-secondary">
            We&apos;ll email a one-time magic link. After they sign in, they are
            attached to this lease with tenant permissions only.
          </p>
          <div className="mt-8 max-w-md">
            <InviteTenantForm leaseId={c.leaseId} />
          </div>
        </section>
      ) : null}

      <section className="border border-outline-variant/15 bg-surface p-8 sm:p-10">
        <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Progress
        </p>
        <ol className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[10px] uppercase tracking-widest text-ink-secondary">
          {CASE_WORKFLOW_STAGES.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={
                  i <= 2 ? "font-bold text-accent-ledger" : "text-ink-muted"
                }
              >
                {s.label}
              </span>
              {i < CASE_WORKFLOW_STAGES.length - 1 ? (
                <span className="text-ink-muted" aria-hidden>
                  —
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <div
          className="mt-4 h-1 w-full overflow-hidden bg-white/5"
          role="presentation"
        >
          <div className="h-full w-1/2 bg-accent-ledger" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <WireSection
            title="Evidence"
            hint="Preview · latest items"
            className="border-none bg-surface-low"
          >
            <p className="text-sm text-ink-secondary">
              4 items · latest: Move-in photos, hallway
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 w-24 shrink-0 bg-surface-highest"
                />
              ))}
            </div>
            <Link
              href={caseRoutes.evidence}
              className="mt-4 inline-block font-headline text-xs font-bold uppercase tracking-widest text-accent-ledger hover:underline"
            >
              View all evidence
            </Link>
          </WireSection>

          <WireSection
            title="Timeline"
            hint="Latest events"
            className="border-none bg-surface-low"
          >
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li>Evidence uploaded — {c.tenant.displayName}</li>
              <li>Case created — You</li>
            </ul>
            <Link
              href={caseRoutes.timeline}
              className="mt-4 inline-block font-headline text-xs font-bold uppercase tracking-widest text-accent-ledger hover:underline"
            >
              Open timeline
            </Link>
          </WireSection>
        </div>

        <div className="flex flex-col gap-4">
          <WireSection
            title="Settlement"
            hint="Financial preview"
            className="border-none bg-surface-card"
          >
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Deposit</dt>
                <dd className="font-headline font-medium tabular-nums text-ink">
                  {formatMoney(c.depositCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Proposed deduction</dt>
                <dd className="font-headline font-medium tabular-nums text-ink">
                  {formatMoney(deductionCents)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-outline-variant/15 pt-2">
                <dt className="text-ink-muted">Refund</dt>
                <dd className="font-headline font-semibold tabular-nums text-accent-green">
                  {formatMoney(refundPreview)}
                </dd>
              </div>
            </dl>
            <Link
              href={caseRoutes.settlement}
              className="mt-4 flex h-11 w-full items-center justify-center border border-outline-variant/40 font-headline text-[10px] font-bold uppercase tracking-widest text-ink hover:border-ink"
            >
              Open settlement
            </Link>
          </WireSection>

          <WireSection
            title="Next action"
            className="border-none bg-surface-card"
          >
            <p className="text-sm text-ink">{c.nextAction}</p>
            <p className="mt-1 text-xs text-ink-muted">Due in 5 days</p>
            <Link
              href={primaryCta.href}
              className="mt-4 inline-flex w-full items-center justify-center py-3 font-headline text-[10px] font-bold uppercase tracking-widest text-ink-muted hover:bg-surface-low hover:text-ink"
            >
              Go to action
            </Link>
          </WireSection>

          <aside className="border border-outline-variant/15 bg-surface-lowest p-6">
            <h2 className="font-headline text-[10px] font-bold uppercase tracking-[0.25em] text-accent-pink">
              AI review
            </h2>
            <p className="mt-3 text-sm text-ink-secondary">
              Assisted summary · medium confidence.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-secondary">
              <li>· Possible wall damage detected</li>
              <li>· Kitchen photo match likely</li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
              AI-assisted review only. Final decisions remain human-controlled.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
