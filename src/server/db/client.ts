import postgres from "postgres";

type GlobalDb = typeof globalThis & {
  __leaseLedgerPostgres?: postgres.Sql;
  __leaseLedgerDatabaseUrl?: string;
};

/**
 * Supabase Postgres connection (direct URI or pooler).
 * Set `DATABASE_URL` in `.env.local` from Supabase → Project Settings → Database.
 * When unset, repositories fall back to in-memory mock data.
 *
 * Recreates the client when `DATABASE_URL` changes so dev/HMR picks up `.env.local` edits
 * (singleton would otherwise keep the first host forever).
 */
export function getDb(): postgres.Sql | null {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return null;

  const g = globalThis as GlobalDb;
  if (g.__leaseLedgerPostgres && g.__leaseLedgerDatabaseUrl !== url) {
    try {
      void g.__leaseLedgerPostgres.end();
    } catch {
      /* ignore */
    }
    g.__leaseLedgerPostgres = undefined;
    g.__leaseLedgerDatabaseUrl = undefined;
  }

  if (!g.__leaseLedgerPostgres) {
    g.__leaseLedgerDatabaseUrl = url;
    const lower = url.toLowerCase();
    /** PgBouncer (transaction mode) and many serverless hosts break prepared statements → wire parse errors (e.g. RangeError offset). */
    const useTransactionPooler =
      lower.includes("pooler.supabase.com") ||
      lower.includes("pgbouncer=true") ||
      /[:@][^/]+:6543\//.test(lower);
    const onVercel = Boolean(process.env.VERCEL);
    g.__leaseLedgerPostgres = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: useTransactionPooler || onVercel ? false : true,
    });
  }
  return g.__leaseLedgerPostgres;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
