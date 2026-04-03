-- Case memberships, tenant invites, Hedera sync on case_events, retry outbox.

ALTER TABLE lease_cases
  ALTER COLUMN tenant_user_id DROP NOT NULL,
  ALTER COLUMN tenant_display_name DROP NOT NULL,
  ALTER COLUMN tenant_email DROP NOT NULL;

ALTER TABLE lease_cases
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS lease_cases_idempotency_key_idx
  ON lease_cases (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE case_events
  ADD COLUMN IF NOT EXISTS hedera_sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (hedera_sync_status IN ('pending', 'publishing', 'published', 'failed')),
  ADD COLUMN IF NOT EXISTS topic_id TEXT;

CREATE TABLE case_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant')),
  display_name TEXT NOT NULL,
  email TEXT,
  hedera_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lease_id, user_id)
);

CREATE UNIQUE INDEX case_memberships_one_landlord_per_lease
  ON case_memberships (lease_id)
  WHERE role = 'landlord';

CREATE UNIQUE INDEX case_memberships_one_tenant_per_lease
  ON case_memberships (lease_id)
  WHERE role = 'tenant';

CREATE INDEX case_memberships_user_id_idx ON case_memberships (user_id);

CREATE TABLE lease_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role = 'tenant'),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX lease_invites_lease_id_idx ON lease_invites (lease_id);

CREATE TABLE hedera_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_event_id UUID NOT NULL REFERENCES case_events (id) ON DELETE CASCADE,
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  UNIQUE (case_event_id)
);

CREATE INDEX hedera_outbox_status_next_idx ON hedera_outbox (status, next_attempt_at);

COMMENT ON TABLE case_memberships IS 'Per-lease landlord/tenant; user_id matches Supabase auth.users.id.';
COMMENT ON TABLE lease_invites IS 'Magic-link invite; token resolved after Supabase auth redirect.';
COMMENT ON COLUMN case_events.hedera_sync_status IS 'HCS publish lifecycle; outbox drives retries.';
COMMENT ON TABLE hedera_outbox IS 'Operational retries only; case_events remains canonical timeline.';
