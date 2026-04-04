"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-styles";

function urlErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "auth") {
    return "Sign-in link expired or invalid. Try again, or use landlord email + password below.";
  }
  if (code === "config") {
    return "Auth is not configured (missing Supabase URL or key).";
  }
  if (code === "invite_email_mismatch") {
    return "The email on this sign-in does not match the invited address. Use the same email the landlord entered, or ask for a new invite to the correct address.";
  }
  if (code === "invite_expired") {
    return "This invite link has expired. Ask the landlord to send a new tenant invite.";
  }
  if (code === "invite_invalid_or_used") {
    return "This invite link was already used or is invalid. Ask the landlord for a fresh invite.";
  }
  if (code.startsWith("invite_")) {
    return "Could not attach this invite to your account. Ask the landlord for a new invite.";
  }
  return null;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    setUrlError(urlErrorMessage(searchParams.get("error")));
  }, [searchParams]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  /* --- Landlord: email + password --- */
  const [landlordEmail, setLandlordEmail] = useState("");
  const [landlordPassword, setLandlordPassword] = useState("");
  const [landlordStatus, setLandlordStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [landlordMessage, setLandlordMessage] = useState<string | null>(null);

  async function onLandlordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLandlordStatus("loading");
    setLandlordMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: landlordEmail.trim(),
      password: landlordPassword,
    });
    if (error) {
      setLandlordStatus("error");
      setLandlordMessage(error.message);
      return;
    }
    setLandlordStatus("idle");
    router.push(routes.dashboard);
    router.refresh();
  }

  /* --- Landlord: register (demo) --- */
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "sent">(
    "idle",
  );
  const [regMessage, setRegMessage] = useState<string | null>(null);

  async function onLandlordRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegMessage(null);
    if (regPassword.length < 6) {
      setRegMessage("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegMessage("Passwords do not match.");
      return;
    }
    setRegStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: landlordEmail.trim(),
      password: regPassword,
      options: {
        emailRedirectTo: `${origin}${routes.authCallback}`,
      },
    });
    if (error) {
      setRegStatus("idle");
      setRegMessage(error.message);
      return;
    }
    setRegStatus("sent");
    setRegMessage(
      "Account created. If email confirmation is on in Supabase, check your inbox; otherwise you can sign in above.",
    );
  }

  /* --- Tenant: magic link --- */
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantStatus, setTenantStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [tenantMessage, setTenantMessage] = useState<string | null>(null);

  async function onTenantMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setTenantStatus("sending");
    setTenantMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: tenantEmail.trim(),
      options: {
        emailRedirectTo: `${origin}${routes.authCallback}`,
      },
    });
    if (error) {
      setTenantStatus("error");
      setTenantMessage(error.message);
      return;
    }
    setTenantStatus("sent");
    setTenantMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="w-full max-w-xl space-y-10">
      <header className="space-y-2">
        <div>
          <span className="mb-3 block font-headline text-[10px] uppercase tracking-[0.28em] text-accent-ledger">
            Security deposit workspace
          </span>
          <h1 className="font-headline text-4xl font-black uppercase leading-[0.95] tracking-tighter text-ink sm:text-5xl">
            LeaseLedger
            <span className="text-accent-ledger">.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-secondary">
            One place for landlords and tenants to upload move-in and move-out
            evidence, agree on deductions, and close the deposit with a clear
            trail—not a pile of texts and screenshots.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Files are encrypted in storage; you&apos;re signing in to your cases
            and settlements. Landlords use email and password; invited tenants
            use a magic link sent to the address the landlord provided.
          </p>
        </div>
      </header>

      {urlError ? (
        <p className="rounded border border-accent-magenta/30 bg-accent-magenta/5 px-4 py-3 text-sm text-accent-magenta">
          {urlError}
        </p>
      ) : null}

      <section className="space-y-4 border border-outline-variant/20 bg-surface-card p-6">
        <h2 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ledger">
          Landlord
        </h2>
        <p className="text-xs text-ink-muted">
          Create an account once, then sign in without email links. In Supabase
          → Auth, you can turn off &quot;Confirm email&quot; for smoother local
          demos.
        </p>
        <form onSubmit={onLandlordSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={landlordEmail}
              onChange={(e) => setLandlordEmail(e.target.value)}
              className={formInputClassName}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={landlordPassword}
              onChange={(e) => setLandlordPassword(e.target.value)}
              className={formInputClassName}
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={landlordStatus === "loading"}
          >
            {landlordStatus === "loading" ? "Signing in…" : "Sign in"}
          </Button>
          {landlordMessage && landlordStatus === "error" ? (
            <p className="text-sm text-accent-magenta">{landlordMessage}</p>
          ) : null}
        </form>

        <details className="border-t border-outline-variant/15 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            First time? Create landlord account
          </summary>
          <form onSubmit={onLandlordRegister} className="mt-4 space-y-4">
            <p className="text-xs text-ink-muted">
              Uses the email above. After sign-up, use &quot;Sign in&quot; with
              the same password.
            </p>
            <div>
              <label className="block text-sm font-medium text-ink">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={formInputClassName}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                className={formInputClassName}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={regStatus === "loading" || !landlordEmail.trim()}
            >
              {regStatus === "loading" ? "Creating…" : "Create account"}
            </Button>
            {regMessage ? (
              <p
                className={
                  regStatus === "sent"
                    ? "text-sm text-ink-secondary"
                    : "text-sm text-accent-magenta"
                }
              >
                {regMessage}
              </p>
            ) : null}
          </form>
        </details>
      </section>

      <section className="space-y-4 border border-outline-variant/20 bg-surface-low/50 p-6">
        <h2 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          Invited tenant
        </h2>
        <p className="text-xs text-ink-muted">
          Use the <strong>same email</strong> the landlord entered on the invite.
          We email you a one-time link (subject to Supabase rate limits).
        </p>
        <form onSubmit={onTenantMagicLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={tenantEmail}
              onChange={(e) => setTenantEmail(e.target.value)}
              className={formInputClassName}
              placeholder="tenant@example.com"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={tenantStatus === "sending"}
          >
            {tenantStatus === "sending" ? "Sending…" : "Send magic link"}
          </Button>
          {tenantMessage ? (
            <p
              className={
                tenantStatus === "error"
                  ? "text-sm text-accent-magenta"
                  : "text-sm text-ink-secondary"
              }
            >
              {tenantMessage}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg animate-pulse text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
