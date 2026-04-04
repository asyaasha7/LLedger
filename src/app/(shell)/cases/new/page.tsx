import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import { userCanActAsLandlord } from "@/server/repos/case-memberships.repo";
import { routes } from "@/config/routes";
import { CreateCaseForm } from "./create-case-form";

/** Avoid static prerender issues with sibling `[caseId]` vs `new` segment. */
export const dynamic = "force-dynamic";

export default async function CreateCasePage() {
  if (isDatabaseConfigured()) {
    const user = await getSessionUser();
    if (user && !(await userCanActAsLandlord(user.id))) {
      redirect(routes.dashboard);
    }
  }

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

      <CreateCaseForm />
    </div>
  );
}
