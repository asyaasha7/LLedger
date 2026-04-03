import postgres from "postgres";

type GlobalSql = typeof globalThis & { __leaseLedgerPostgres?: postgres.Sql };

/**
 * Supabase Postgres connection (direct URI or pooler).
 * Set `DATABASE_URL` in `.env.local` from Supabase → Project Settings → Database.
 * When unset, repositories fall back to in-memory mock data.
 */
export function getDb(): postgres.Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) return null;

  const g = globalThis as GlobalSql;
  if (!g.__leaseLedgerPostgres) {
    g.__leaseLedgerPostgres = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return g.__leaseLedgerPostgres;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
