import type { LeaseCaseStatus } from "@/domain";
import { LEASE_CASE_STATUS_LABELS } from "@/domain";
import { cn } from "@/lib/cn";

const statusStyles: Record<LeaseCaseStatus, string> = {
  OPEN:
    "bg-surface-highest text-[10px] font-bold uppercase tracking-[0.15em] text-ink",
  EVIDENCE_IN_PROGRESS:
    "bg-accent-ledger/10 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-ledger",
  UNDER_REVIEW:
    "bg-accent-ledger/10 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-ledger",
  DISPUTED:
    "bg-accent-magenta/20 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-magenta",
  SETTLEMENT_PENDING:
    "bg-accent-pink/15 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-pink",
  APPROVED_FOR_REFUND:
    "bg-accent-green-soft text-[10px] font-bold uppercase tracking-[0.15em] text-accent-green",
  REFUND_SCHEDULED:
    "bg-accent-green-soft text-[10px] font-bold uppercase tracking-[0.15em] text-accent-green",
  REFUND_COMPLETE:
    "bg-accent-green-soft text-[10px] font-bold uppercase tracking-[0.15em] text-accent-green",
};

export function StatusPill({
  status,
  className,
}: {
  status: LeaseCaseStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1",
        statusStyles[status],
        className,
      )}
    >
      {LEASE_CASE_STATUS_LABELS[status]}
    </span>
  );
}
