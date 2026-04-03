-- LeaseLedger workflow schema for Supabase Postgres.
-- RLS: leave disabled until Supabase Auth is wired; server repos use DATABASE_URL (postgres role bypasses RLS).
-- Storage: encrypted evidence blobs live in Supabase Storage; this DB holds paths in encrypted_storage_ref.

CREATE TABLE lease_cases (
  lease_id TEXT PRIMARY KEY,
  property_ref TEXT NOT NULL,
  lease_ref TEXT NOT NULL,
  landlord_user_id TEXT NOT NULL,
  landlord_display_name TEXT NOT NULL,
  landlord_email TEXT,
  tenant_user_id TEXT NOT NULL,
  tenant_display_name TEXT NOT NULL,
  tenant_email TEXT,
  deposit_cents BIGINT NOT NULL CHECK (deposit_cents >= 0),
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  status TEXT NOT NULL,
  hedera_topic_id TEXT,
  hedera_refund_schedule_id TEXT,
  next_action TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id TEXT NOT NULL UNIQUE,
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  submitted_by_user_id TEXT NOT NULL,
  submitter_role TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  room_tag TEXT,
  file_hash TEXT NOT NULL,
  encrypted_storage_ref TEXT NOT NULL,
  review_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evidence_items_lease_id_created_at_idx ON evidence_items (lease_id, created_at);

CREATE TABLE review_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_action_id TEXT NOT NULL UNIQUE,
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence_items (evidence_id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX review_actions_lease_id_idx ON review_actions (lease_id);

CREATE TABLE deduction_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id TEXT NOT NULL UNIQUE,
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
  reason TEXT NOT NULL,
  linked_evidence_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deduction_proposals_lease_id_idx ON deduction_proposals (lease_id);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id TEXT NOT NULL UNIQUE,
  lease_id TEXT NOT NULL UNIQUE REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  deposit_amount_cents BIGINT NOT NULL CHECK (deposit_amount_cents >= 0),
  deduction_amount_cents BIGINT NOT NULL CHECK (deduction_amount_cents >= 0),
  refund_amount_cents BIGINT NOT NULL CHECK (refund_amount_cents >= 0),
  status TEXT NOT NULL,
  approved_by_tenant BOOLEAN NOT NULL DEFAULT false,
  approved_by_landlord BOOLEAN NOT NULL DEFAULT false,
  hedera_schedule_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  lease_id TEXT NOT NULL REFERENCES lease_cases (lease_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'app',
  source_ref TEXT,
  topic_sequence BIGINT,
  running_hash TEXT,
  transaction_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX case_events_lease_id_created_at_idx ON case_events (lease_id, created_at);

COMMENT ON TABLE lease_cases IS 'Primary lease / deposit workflow aggregate; hedera_topic_id set after topic provision.';
COMMENT ON TABLE evidence_items IS 'Evidence metadata; files in Supabase Storage at encrypted_storage_ref.';
COMMENT ON TABLE case_events IS 'Normalized timeline + Hedera audit fields (sequence, running_hash, transaction_id).';

-- Seed data (matches former src/data/mock/* for local parity)
INSERT INTO lease_cases (
  lease_id, property_ref, lease_ref,
  landlord_user_id, landlord_display_name, landlord_email,
  tenant_user_id, tenant_display_name, tenant_email,
  deposit_cents, lease_start, lease_end, status,
  hedera_topic_id, hedera_refund_schedule_id, next_action
) VALUES
  (
    'lease-001', 'Unit 4B', 'Lease-001',
    'user-landlord-demo', 'You', NULL,
    'user-tenant-jordan', 'Jordan Lee', 'jordan@example.com',
    240000, '2024-06-01', '2025-05-31', 'SETTLEMENT_PENDING',
    NULL, NULL, 'Review settlement proposal'
  ),
  (
    'lease-002', '12 Oak Street', 'Lease-002',
    'user-landlord-demo', 'You', NULL,
    'user-tenant-sam', 'Sam Rivera', NULL,
    180000, '2024-01-15', '2025-01-14', 'EVIDENCE_IN_PROGRESS',
    NULL, NULL, 'Upload move-out evidence'
  );

INSERT INTO evidence_items (
  evidence_id, lease_id, submitted_by_user_id, submitter_role,
  evidence_type, category, title, description, room_tag,
  file_hash, encrypted_storage_ref, review_status, created_at
) VALUES
  ('ev-1', 'lease-001', 'user-tenant-jordan', 'tenant', 'MOVE_IN_PHOTO', 'Move-In',
   'Kitchen · wide angle', 'Counters, sink, and upper cabinets', 'Kitchen',
   'sha256:mock00000000000000000000000000000000000000000000000000000001',
   'blob:vault:lease-001/ev-1 ciphertext', 'SUBMITTED', '2026-04-02T14:04:00Z'),
  ('ev-2', 'lease-001', 'user-tenant-jordan', 'tenant', 'MOVE_IN_PHOTO', 'Move-In',
   'Hallway · floor', 'Full length from entry', 'Hallway',
   'sha256:mock00000000000000000000000000000000000000000000000000000002',
   'blob:vault:lease-001/ev-2 ciphertext', 'SUBMITTED', '2026-04-02T14:04:00Z'),
  ('ev-3', 'lease-001', 'user-landlord-demo', 'landlord', 'MOVE_OUT_PHOTO', 'Move-Out',
   'Living room', 'Final walk-through set', 'Living room',
   'sha256:mock00000000000000000000000000000000000000000000000000000003',
   'blob:vault:lease-001/ev-3 ciphertext', 'ACKNOWLEDGED', '2026-03-28T18:00:00Z'),
  ('ev-4', 'lease-001', 'user-landlord-demo', 'landlord', 'DAMAGE_PHOTO', 'Damage',
   'Wall scratch', 'Near entry, right of closet', 'Entry',
   'sha256:mock00000000000000000000000000000000000000000000000000000004',
   'blob:vault:lease-001/ev-4 ciphertext', 'DISPUTED', '2026-03-29T10:30:00Z'),
  ('ev-5', 'lease-002', 'user-tenant-sam', 'tenant', 'REPAIR_RECEIPT', 'Receipts',
   'Cleaning invoice', 'Move-out professional clean', NULL,
   'sha256:mock00000000000000000000000000000000000000000000000000000005',
   'blob:vault:lease-002/ev-5 ciphertext', 'SUBMITTED', '2026-03-30T12:00:00Z'),
  ('ev-6', 'lease-002', 'user-landlord-demo', 'landlord', 'DAMAGE_PHOTO', 'Damage',
   'Cabinet hinge', 'Kitchen lower, left side', 'Kitchen',
   'sha256:mock00000000000000000000000000000000000000000000000000000006',
   'blob:vault:lease-002/ev-6 ciphertext', 'SUBMITTED', '2026-03-30T15:00:00Z');

INSERT INTO settlements (
  settlement_id, lease_id, deposit_amount_cents, deduction_amount_cents, refund_amount_cents,
  status, approved_by_tenant, approved_by_landlord, hedera_schedule_id, created_at
) VALUES
  ('set-lease-001', 'lease-001', 240000, 40000, 200000, 'PROPOSED', false, true, NULL, '2026-04-01T16:00:00Z'),
  ('set-lease-002', 'lease-002', 180000, 25000, 155000, 'PROPOSED', false, false, NULL, '2026-03-15T11:00:00Z');

INSERT INTO deduction_proposals (
  proposal_id, lease_id, amount_cents, reason, linked_evidence_ids, status, created_at
) VALUES
  ('ded-001', 'lease-001', 40000, 'Wall touch-up and move-out cleaning per linked evidence',
   ARRAY['ev-3', 'ev-4']::text[], 'ACTIVE', '2026-04-01T17:00:00Z'),
  ('ded-002', 'lease-002', 25000, 'Cabinet repair estimate and cleaning',
   ARRAY['ev-5', 'ev-6']::text[], 'ACTIVE', '2026-03-20T09:00:00Z');
