import Link from "next/link";
import { routes } from "@/config/routes";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import {
  listLeaseCases,
  listLeaseCasesForUser,
} from "@/server/repos/lease-cases.repo";
import { formatMoney } from "@/lib/format-money";
import { StatusPill } from "@/components/ui/status-pill";

export default async function CasesPage() {
  const user = await getSessionUser();
  const cases =
    isDatabaseConfigured() && user
      ? await listLeaseCasesForUser(user.id)
      : await listLeaseCases();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
            Lease registry
          </p>
          <h1 className="mt-2 font-headline text-3xl font-black uppercase tracking-tighter text-ink">
            All cases
          </h1>
        </div>
        <Link
          href={routes.newCase}
          className="inline-flex h-11 items-center justify-center bg-accent-ledger px-6 font-headline text-[10px] font-bold uppercase tracking-widest text-accent-on-ledger transition-opacity hover:opacity-90"
        >
          New entry
        </Link>
      </div>

      <ul className="border border-outline-variant/20 bg-surface-low">
        {cases.map((c) => (
          <li
            key={c.leaseId}
            className="border-b border-outline-variant/15 last:border-0"
          >
            <Link
              href={routes.case(c.leaseId).overview}
              className="flex flex-col gap-3 px-6 py-6 transition-colors hover:bg-surface-card sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <div>
                <p className="font-headline text-lg font-bold text-ink">
                  {c.propertyRef}{" "}
                  <span className="font-normal text-ink-muted">·</span>{" "}
                  {c.leaseRef}
                </p>
                <p className="text-sm text-ink-secondary">
                  {c.tenant.displayName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-headline text-sm tabular-nums text-ink-muted">
                  {formatMoney(c.depositCents)}
                </span>
                <StatusPill status={c.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
