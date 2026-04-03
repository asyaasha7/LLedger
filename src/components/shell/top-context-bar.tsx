"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import type { LeaseCase } from "@/domain";
import { TOP_BAR_TABS } from "@/config/top-bar-tabs";
import { routes } from "@/config/routes";
import { getCasePrimaryAction } from "@/lib/case-actions";
import { extractCaseIdFromPath } from "@/lib/parse-case-path";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

export function TopContextBar() {
  const pathname = usePathname();
  const caseId = extractCaseIdFromPath(pathname);
  const [caseData, setCaseData] = useState<LeaseCase | null>(null);

  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      return;
    }
    let cancelled = false;
    setCaseData(null);
    fetch(`/api/lease-cases/${encodeURIComponent(caseId)}`)
      .then(async (r) => {
        if (!r.ok) return null;
        return (await r.json()) as LeaseCase;
      })
      .then((data) => {
        if (!cancelled && data) setCaseData(data);
      })
      .catch(() => {
        if (!cancelled) setCaseData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const onCaseOverview =
    caseData &&
    caseId &&
    (pathname === routes.case(caseId).overview ||
      pathname === `${routes.case(caseId).overview}/`);

  const primaryAction = caseData ? getCasePrimaryAction(caseData) : null;

  return (
    <header className="sticky top-0 z-50 flex h-20 w-full items-center gap-6 border-b border-outline-variant/20 bg-surface/80 px-6 backdrop-blur-xl sm:px-10 lg:px-12">
      <nav
        className="hidden items-center gap-8 md:flex"
        aria-label="Section"
      >
        {TOP_BAR_TABS.map(({ href, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "font-headline text-xs font-bold uppercase leading-none tracking-tight transition-colors",
                active
                  ? "border-b border-accent-ledger pb-1 text-accent-ledger"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 md:pl-4">
        {caseData ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate font-headline text-sm font-semibold text-ink">
              {caseData.propertyRef}{" "}
              <span className="font-normal text-ink-muted">·</span>{" "}
              {caseData.leaseRef}
            </p>
            <p className="truncate text-[10px] uppercase tracking-widest text-ink-muted">
              Active workspace
            </p>
          </div>
        ) : (
          <p className="font-headline text-xs font-bold uppercase tracking-widest text-ink-muted md:hidden">
            LeaseLedger
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4 lg:gap-6">
        {caseData ? <StatusPill status={caseData.status} /> : null}
        {onCaseOverview && primaryAction ? (
          <Link
            href={primaryAction.href}
            className="hidden h-10 items-center justify-center bg-accent-ledger px-4 font-headline text-[10px] font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {primaryAction.label}
          </Link>
        ) : null}
        <button
          type="button"
          className="relative text-ink-muted transition-colors hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 bg-accent-magenta" />
        </button>
        <Link
          href={routes.settings}
          className="text-ink-muted transition-colors hover:text-ink"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center border border-outline-variant/30 bg-surface-highest text-[10px] font-bold text-ink">
          LL
        </div>
      </div>
    </header>
  );
}
