import { WireSection } from "@/components/wireframe/wire-section";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
          Compliance
        </span>
        <h1 className="mt-2 font-headline text-3xl font-black uppercase tracking-tighter text-ink">
          Legal briefs
        </h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Workspace preferences and policy placeholders (wireframe).
        </p>
      </div>
      <WireSection title="Account" className="border-solid bg-surface-low" />
      <WireSection title="Notifications" className="border-solid bg-surface-low" />
      <WireSection title="Security" className="border-solid bg-surface-low" />
    </div>
  );
}
