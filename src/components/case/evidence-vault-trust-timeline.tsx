"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Lock } from "lucide-react";
import type { EvidenceFilterLabel, EvidenceItem } from "@/domain";
import { EVIDENCE_FILTER_LABELS } from "@/domain";
import { routes } from "@/config/routes";
import { TRUST_TIMELINE_IMAGES } from "@/lib/design-assets";
import { formatMoney } from "@/lib/format-money";
import { formatShortDate } from "@/lib/format-short-date";
import { formatTimelineTimeUtc } from "@/lib/format-timeline-stamp";
import { truncateProofDisplay } from "@/lib/truncate-hash";
import { cn } from "@/lib/cn";

export type EvidenceVaultTrustTimelineProps = {
  caseId: string;
  ledgerRef: string;
  propertyRef: string;
  depositCents: number;
  landlordDisplayName: string;
  tenantDisplayName: string;
  items: EvidenceItem[];
  uploadHref: string;
  portfolioTotalDepositsCents: number;
  activeLeaseCount: number;
  globalDisputedCount: number;
};

function submitterName(
  item: EvidenceItem,
  landlord: string,
  tenant: string,
): string {
  return item.submitterRole === "landlord" ? landlord : tenant;
}

function categoryEyebrow(item: EvidenceItem): string {
  switch (item.category) {
    case "Move-In":
      return "Move-in record";
    case "Move-Out":
      return "Condition record";
    case "Damage":
      return "Damage documentation";
    case "Receipts":
      return "Financial record";
    default:
      return "Evidence submission";
  }
}

function complianceScorePercent(items: EvidenceItem[]): string {
  if (items.length === 0) return "100.0";
  const disputed = items.filter((i) => i.reviewStatus === "DISPUTED").length;
  const score = Math.max(94, 100 - disputed * 2.1 - (items.length > 6 ? 0.4 : 0));
  return score.toFixed(1);
}

function exportAuditJson(
  ledgerRef: string,
  items: EvidenceItem[],
): void {
  const payload = {
    ledgerRef,
    exportedAt: new Date().toISOString(),
    entries: items.map((e) => ({
      evidenceId: e.evidenceId,
      evidenceType: e.evidenceType,
      category: e.category,
      fileHash: e.fileHash,
      storageRef: e.encryptedStorageRef,
      createdAt: e.createdAt,
      reviewStatus: e.reviewStatus,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leaseledger-evidence-audit-${ledgerRef.replace(/[^a-z0-9]+/gi, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EvidenceVaultTrustTimeline({
  caseId,
  ledgerRef,
  propertyRef,
  depositCents,
  landlordDisplayName,
  tenantDisplayName,
  items: allItems,
  uploadHref,
  portfolioTotalDepositsCents,
  activeLeaseCount,
  globalDisputedCount,
}: EvidenceVaultTrustTimelineProps) {
  const [filter, setFilter] = useState<EvidenceFilterLabel>("All");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allItems.filter((item) => {
      const categoryOk = filter === "All" || item.category === filter;
      if (!categoryOk) return false;
      if (!q) return true;
      const haystack =
        `${item.title} ${item.description} ${item.roomTag ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
    return [...filtered].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [allItems, filter, query]);

  /** Disputed rows use a fixed layout; other rows alternate like the design reference. */
  const rowLayouts = useMemo(() => {
    let nonDisputed = 0;
    return items.map((item) => {
      if (item.reviewStatus === "DISPUTED") return "disputed" as const;
      const layout = nonDisputed % 2 === 0 ? ("even" as const) : ("odd" as const);
      nonDisputed += 1;
      return layout;
    });
  }, [items]);

  const reviewHref = routes.case(caseId).evidenceReview;
  const compliance = complianceScorePercent(allItems);

  return (
    <div className="overflow-x-hidden">
      <header className="pb-16 pt-4 md:pb-24 md:pt-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 block font-headline text-[10px] tracking-[0.3em] text-accent-ledger">
              Ledger ref: {ledgerRef}
            </span>
            <h1 className="font-headline text-5xl font-bold uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl md:text-8xl">
              Trust
              <br />
              timeline<span className="text-accent-ledger">.</span>
            </h1>
            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-ink-secondary">
              Immutable cryptographic history of evidence submissions for{" "}
              <span className="text-ink">{propertyRef}</span>. Raw files stay in
              your private vault; hashes and workflow events anchor the trust
              trail.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end lg:flex-col lg:items-end">
            <Link
              href={uploadHref}
              className="inline-flex h-12 items-center justify-center bg-accent-ledger px-8 font-headline text-[10px] font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90"
            >
              Submit evidence
            </Link>
            <div className="border-l-2 border-accent-ledger bg-surface-card p-6 text-right">
              <div className="font-headline text-4xl font-bold tracking-tighter text-accent-ledger md:text-5xl">
                {compliance}%
              </div>
              <div className="mt-1 font-sans text-[10px] uppercase tracking-widest text-ink-muted">
                Vault integrity score
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-outline-variant/15 pt-8">
          {EVIDENCE_FILTER_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              className={cn(
                "px-3 py-1.5 font-headline text-[10px] font-bold uppercase tracking-widest transition-colors",
                label === filter
                  ? "bg-accent-ledger text-accent-on-ledger"
                  : "bg-surface-card text-ink-muted hover:bg-surface-high hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search evidence…"
            className="ml-auto min-w-[12rem] border border-outline-variant/30 bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent-ledger focus:outline-none"
          />
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl pb-24 md:pb-40">
        <div
          className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-outline-variant/20 md:block"
          aria-hidden
        />

        {items.length === 0 ? (
          <div className="border border-outline-variant/20 bg-surface-low px-8 py-20 text-center">
            <p className="font-headline text-sm font-bold text-ink">
              No evidence in this view
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              Adjust filters or submit new files to grow the timeline.
            </p>
            <Link
              href={uploadHref}
              className="mt-6 inline-flex h-11 items-center justify-center border border-outline-variant/40 px-6 font-headline text-[10px] font-bold uppercase tracking-widest text-ink hover:border-ink"
            >
              Upload evidence
            </Link>
          </div>
        ) : (
          <div className="space-y-24 md:space-y-40">
            {items.map((item, index) => {
              const imageSrc =
                TRUST_TIMELINE_IMAGES[index % TRUST_TIMELINE_IMAGES.length]!;
              const layout = rowLayouts[index]!;

              if (layout === "disputed") {
                return (
                  <div
                    key={item.evidenceId}
                    className="relative grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-24"
                  >
                    <div className="md:text-right">
                      <div className="mb-3 font-sans text-[10px] uppercase tracking-widest text-accent-pink">
                        Risk alert
                      </div>
                      <h2 className="font-headline text-3xl font-bold tracking-tight text-accent-pink sm:text-4xl">
                        {item.title}
                      </h2>
                      <p className="mt-4 max-w-md font-sans leading-relaxed text-ink-secondary md:ml-auto">
                        {item.description} Submitted by{" "}
                        {submitterName(
                          item,
                          landlordDisplayName,
                          tenantDisplayName,
                        )}{" "}
                        · {formatShortDate(item.createdAt)} ·{" "}
                        {formatTimelineTimeUtc(item.createdAt)}.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2 md:justify-end">
                        <span className="bg-accent-magenta/15 px-3 py-1 font-sans text-[9px] font-medium uppercase tracking-widest text-accent-magenta">
                          Contested
                        </span>
                        <span className="bg-surface-highest px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-ink-muted">
                          Review pending
                        </span>
                      </div>
                      <Link
                        href={reviewHref}
                        className="mt-6 inline-block font-headline text-[10px] font-bold uppercase tracking-widest text-accent-ledger hover:underline md:ml-auto md:block md:text-right"
                      >
                        Open review →
                      </Link>
                    </div>
                    <span
                      className="absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-accent-pink ring-8 ring-accent-pink/10 md:block"
                      aria-hidden
                    />
                    <div className="border-l-4 border-accent-pink bg-surface-card p-8">
                      <div className="mb-4 flex items-center gap-3">
                        <AlertTriangle
                          className="h-5 w-5 text-accent-pink"
                          strokeWidth={1.5}
                        />
                        <span className="font-sans text-[10px] uppercase tracking-widest text-accent-pink">
                          Dispute logged
                        </span>
                      </div>
                      <p className="font-sans text-sm italic leading-loose text-ink-secondary">
                        &ldquo;{item.description}&rdquo;
                      </p>
                      <p className="mt-4 font-mono text-[10px] text-ink-muted">
                        {item.evidenceId} · {truncateProofDisplay(item.fileHash)}
                      </p>
                    </div>
                  </div>
                );
              }

              if (layout === "even") {
                return (
                  <div
                    key={item.evidenceId}
                    className="relative grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-24"
                  >
                    <div className="md:text-right">
                      <div className="mb-3 font-sans text-[10px] uppercase tracking-widest text-accent-ledger">
                        {categoryEyebrow(item)}
                      </div>
                      <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                        {item.title}
                      </h2>
                      <p className="mt-4 max-w-md font-sans leading-relaxed text-ink-secondary md:ml-auto">
                        {item.description} Anchored at{" "}
                        {formatTimelineTimeUtc(item.createdAt)} ·{" "}
                        {formatShortDate(item.createdAt)}. Submitted by{" "}
                        {submitterName(
                          item,
                          landlordDisplayName,
                          tenantDisplayName,
                        )}
                        .
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2 md:justify-end">
                        <span className="bg-surface-highest px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-ink">
                          {item.reviewStatus}
                        </span>
                        <span className="bg-surface-highest px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-ink-muted">
                          Private vault
                        </span>
                      </div>
                      <Link
                        href={reviewHref}
                        className="mt-6 inline-block font-headline text-[10px] font-bold uppercase tracking-widest text-accent-ledger hover:underline md:ml-auto md:block md:text-right"
                      >
                        Open review →
                      </Link>
                    </div>
                    <span
                      className="absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-accent-ledger ring-8 ring-accent-ledger/10 md:block"
                      aria-hidden
                    />
                    <div className="border border-outline-variant/15 bg-surface-low p-8">
                      <div className="mb-6 flex items-center gap-3">
                        <Lock
                          className="h-5 w-5 text-accent-ledger"
                          strokeWidth={1.5}
                        />
                        <span className="font-sans text-[10px] uppercase tracking-widest text-ink-muted">
                          Proof chain: {truncateProofDisplay(item.fileHash)}
                        </span>
                      </div>
                      <div className="relative h-48 w-full overflow-hidden bg-surface-highest">
                        <Image
                          src={imageSrc}
                          alt="Editorial reference still for evidence timeline"
                          fill
                          className="object-cover grayscale contrast-125"
                          sizes="(min-width: 768px) 40vw, 100vw"
                        />
                      </div>
                      <p className="mt-4 font-mono text-[10px] text-ink-muted">
                        {item.roomTag ? `${item.roomTag} · ` : null}
                        {item.evidenceType.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.evidenceId}
                  className="relative grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-24"
                >
                  <div className="order-2 border border-outline-variant/15 bg-surface-low p-8 md:order-1">
                    <div className="mb-6 flex items-center gap-3">
                      <Building2
                        className="h-5 w-5 text-accent-ledger"
                        strokeWidth={1.5}
                      />
                      <span className="font-sans text-[10px] uppercase tracking-widest text-ink-muted">
                        Evidence record
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-end justify-between gap-4 border-b border-outline-variant/10 pb-2">
                        <span className="text-[10px] uppercase text-ink-muted">
                          Case deposit (context)
                        </span>
                        <span className="font-headline text-xl font-bold tabular-nums">
                          {formatMoney(depositCents)}
                        </span>
                      </div>
                      <div className="flex items-end justify-between gap-4 border-b border-outline-variant/10 pb-2">
                        <span className="text-[10px] uppercase text-ink-muted">
                          Filing
                        </span>
                        <span className="font-headline text-xl font-bold">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4 pt-1">
                        <span className="text-[10px] uppercase text-ink-muted">
                          Encrypted ref
                        </span>
                        <span className="max-w-[60%] truncate font-mono text-[10px] text-ink-secondary">
                          {item.encryptedStorageRef}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-accent-ledger ring-8 ring-accent-ledger/10 md:block"
                    aria-hidden
                  />
                  <div className="order-1 md:order-2">
                    <div className="mb-3 font-sans text-[10px] uppercase tracking-widest text-accent-ledger">
                      {categoryEyebrow(item)}
                    </div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                      {item.title}
                    </h2>
                    <p className="mt-4 max-w-md font-sans leading-relaxed text-ink-secondary">
                      {item.description} Record sealed with content hash and
                      off-chain encrypted storage reference.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="bg-accent-ledger/15 px-3 py-1 font-sans text-[9px] font-medium uppercase tracking-widest text-accent-ledger">
                        {item.reviewStatus}
                      </span>
                      <span className="bg-surface-highest px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-ink-muted">
                        Vaulted
                      </span>
                    </div>
                    <div className="relative mt-6 h-40 w-full overflow-hidden border border-outline-variant/15 bg-surface-highest md:hidden">
                      <Image
                        src={imageSrc}
                        alt="Editorial reference still for evidence timeline"
                        fill
                        className="object-cover grayscale opacity-80"
                        sizes="100vw"
                      />
                    </div>
                    <Link
                      href={reviewHref}
                      className="mt-6 inline-block font-headline text-[10px] font-bold uppercase tracking-widest text-accent-ledger hover:underline"
                    >
                      Open review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-outline-variant/15 bg-surface-sidebar px-6 py-16 sm:px-12 md:px-20">
        <div className="mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-between gap-12 md:flex-row md:items-center">
          <div>
            <h3 className="mb-3 font-sans text-[10px] tracking-[0.3em] text-ink-muted uppercase">
              Total deposits on registry
            </h3>
            <p className="font-headline text-5xl font-black tracking-tighter text-ink md:text-6xl">
              {formatMoney(portfolioTotalDepositsCents)}
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <span className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-accent-ledger">
                Active leases
              </span>
              <span className="font-headline text-3xl font-bold tabular-nums">
                {String(activeLeaseCount).padStart(2, "0")}
              </span>
            </div>
            <div>
              <span className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-accent-pink">
                Open disputes
              </span>
              <span className="font-headline text-3xl font-bold tabular-nums">
                {String(globalDisputedCount).padStart(2, "0")}
              </span>
            </div>
            <div>
              <span className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-ink-muted">
                Last sync
              </span>
              <span className="font-headline text-lg font-bold uppercase text-ink">
                Live
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportAuditJson(ledgerRef, allItems)}
            className="bg-ink px-10 py-4 font-headline text-xs font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
          >
            Export audit
          </button>
        </div>
        <p className="mx-auto mt-10 max-w-6xl font-sans text-[11px] leading-relaxed text-ink-muted">
          Export includes metadata only (ids, hashes, statuses). It never
          includes raw image or document bytes.
        </p>
      </footer>
    </div>
  );
}
