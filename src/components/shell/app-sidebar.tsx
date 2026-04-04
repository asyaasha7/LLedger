"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_FOOTER_ACTIONS, SIDEBAR_NAV } from "@/config/sidebar-nav";
import { routes } from "@/config/routes";
import { cn } from "@/lib/cn";
import { SignOutButton } from "@/components/shell/sign-out-button";

export function AppSidebar({
  landlordFeaturesEnabled = true,
}: {
  landlordFeaturesEnabled?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-[60] flex h-screen w-sidebar flex-col border-r border-outline-variant/10 bg-surface-sidebar px-6 py-10">
      <div className="mb-12">
        <Link href={routes.dashboard} className="block">
          <span className="font-headline text-xl font-black uppercase tracking-[0.2em] text-accent-ledger">
            LeaseLedger
          </span>
          <p className="mt-2 font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
            {landlordFeaturesEnabled ? "Executive Portal" : "Tenant access"}
          </p>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
        {SIDEBAR_NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 px-4 py-4 font-headline text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98]",
                active
                  ? "border-l-4 border-accent-ledger bg-surface-card text-accent-ledger"
                  : "border-l-4 border-transparent text-ink-muted hover:bg-surface-card hover:text-ink",
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", active && "text-accent-ledger")}
                strokeWidth={1.5}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-outline-variant/20 pt-8">
        {landlordFeaturesEnabled ? (
          <Link
            href={routes.newCase}
            className="flex w-full items-center justify-center bg-accent-ledger py-4 font-headline text-xs font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            New Entry
          </Link>
        ) : null}
        <div className="space-y-1">
          <SignOutButton />
          {SIDEBAR_FOOTER_ACTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex w-full items-center gap-4 px-4 py-2 text-left font-headline text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
