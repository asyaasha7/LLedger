import Link from "next/link";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import {
  formInputClassName,
  formTextareaClassName,
} from "@/components/ui/form-styles";

export default function CreateCasePage() {
  return (
    <div className="mx-auto max-w-prose py-4">
      <div className="mb-10">
        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
          New entry
        </span>
        <h1 className="mt-2 font-headline text-2xl font-black uppercase tracking-tighter text-ink sm:text-3xl">
          Create lease case
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Opens a private evidence workspace for both parties. Files stay
          encrypted off-chain; Hedera records hashes, storage refs, and workflow
          events only.
        </p>
      </div>

      <div className="border border-outline-variant/20 bg-surface-card p-6 sm:p-8">
        <form className="space-y-6" noValidate>
          <Field label="Property / unit" placeholder="e.g. Unit 4B" />
          <Field label="Landlord name" placeholder="Your name or organization" />
          <Field label="Tenant name" placeholder="Full name" />
          <Field
            label="Tenant email or identifier"
            placeholder="email@example.com"
            type="email"
          />
          <Field label="Deposit amount" placeholder="$0" inputMode="decimal" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Lease start date" type="date" />
            <Field label="Lease end date" type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Optional notes
            </label>
            <p className="mt-1 text-xs text-ink-muted">
              Short context for your team (optional)
            </p>
            <textarea
              rows={3}
              className={formTextareaClassName}
              placeholder="Anything helpful for later review…"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/15 pt-6 sm:flex-row sm:justify-between">
            <Link href={routes.dashboard}>
              <Button variant="secondary" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Create case
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={formInputClassName}
      />
    </div>
  );
}
