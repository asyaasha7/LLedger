import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Sparkles,
} from "lucide-react";
import type { TimelineEvent, TimelineTone } from "@/domain";
import { cn } from "@/lib/cn";

const TONE_ROW_CLASS: Record<TimelineTone, string> = {
  neutral:
    "border-accent-ledger/40 bg-accent-ledger/10 text-accent-ledger",
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  risk: "border-accent-magenta/40 bg-accent-magenta/15 text-accent-magenta",
  ai: "border-accent-violet/40 bg-accent-violet-soft text-accent-violet",
};

const TONE_BADGE_LABEL: Record<TimelineTone, string> = {
  neutral: "Progress",
  success: "Done",
  risk: "Attention",
  ai: "AI note",
};

function iconForTone(tone: TimelineTone): LucideIcon {
  switch (tone) {
    case "success":
      return CheckCircle2;
    case "risk":
      return AlertCircle;
    case "ai":
      return Sparkles;
    default:
      return CircleDot;
  }
}

export function CaseTimelineList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative pl-10 sm:pl-14">
      <div
        className="absolute bottom-0 left-[17px] top-2 w-px bg-outline-variant/30 sm:left-[21px]"
        aria-hidden
      />
      <ul className="space-y-10">
        {events.map((event) => {
          const Icon = iconForTone(event.tone);
          const rowClass = TONE_ROW_CLASS[event.tone];
          return (
            <li key={event.id} className="relative">
              <span
                className={cn(
                  "absolute -left-10 flex h-9 w-9 items-center justify-center border bg-surface sm:-left-12",
                  rowClass,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="border border-outline-variant/20 bg-surface-low p-6 transition-colors hover:bg-surface-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-headline text-base font-bold text-ink">
                    {event.title}
                  </h2>
                  <span
                    className={cn(
                      "border px-2 py-0.5 font-headline text-[9px] font-bold uppercase tracking-widest",
                      rowClass,
                    )}
                  >
                    {TONE_BADGE_LABEL[event.tone]}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-widest text-ink-muted">
                  {event.actorLabel} · {event.timestampLabel}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                  {event.detail}
                </p>
                {event.eventType ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    {event.eventType}
                  </p>
                ) : null}
                {event.hederaLabel ? (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-accent-ledger">
                    {event.hederaLabel}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
