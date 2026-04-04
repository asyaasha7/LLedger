-- Realistic demo narrative for lease-001: SF 1BR, $3,200 deposit, itemized ~$892.50 deduction,
-- settlement proposed and awaiting tenant (landlord already approved in seed).
-- Keeps evidence ids ev-1..ev-4 so links in deduction_proposals stay valid.

UPDATE lease_cases
SET
  property_ref = '1847 Market St · Unit 4B',
  lease_ref = 'LL-2024-4B-MKT',
  deposit_cents = 320000,
  next_action = 'Tenant: review settlement and respond (approve or reject)'
WHERE lease_id = 'lease-001';

UPDATE evidence_items
SET
  title = 'Kitchen · move-in baseline',
  description = 'Full kitchen at key handoff; counters, sink, and cabinets documented for condition baseline.'
WHERE evidence_id = 'ev-1';

UPDATE evidence_items
SET
  title = 'Hallway · flooring at move-in',
  description = 'Entry through hall; establishes wear state at start of tenancy.'
WHERE evidence_id = 'ev-2';

UPDATE evidence_items
SET
  title = 'Living room · move-out walk-through',
  description = 'Final walk-through: blinds, carpet edge, and general condition at lease end.'
WHERE evidence_id = 'ev-3';

UPDATE evidence_items
SET
  title = 'Entry · wall touch-up zone',
  description = 'Scuffing near closet; landlord cites repainting; tenant disputes extent vs. normal use.'
WHERE evidence_id = 'ev-4';

UPDATE deduction_proposals
SET
  amount_cents = 89250,
  reason = 'Itemized: entry wall repaint touch-up ($275), certified move-out deep clean per vendor invoice ($285), living-room blinds cord + hardware ($332.50). Linked to move-out set (ev-3) and entry damage documentation (ev-4).'
WHERE proposal_id = 'ded-001';

UPDATE settlements
SET
  deposit_amount_cents = 320000,
  deduction_amount_cents = 89250,
  refund_amount_cents = 230750
WHERE settlement_id = 'set-lease-001';
