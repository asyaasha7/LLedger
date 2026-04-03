"use client";

import { useState } from "react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { formInputClassName } from "@/components/ui/form-styles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}${routes.authCallback}`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="w-full max-w-md space-y-10">
      <div>
        <Link
          href={routes.dashboard}
          className="font-headline text-xs font-bold uppercase tracking-widest text-accent-ledger"
        >
          ← LeaseLedger
        </Link>
        <h1 className="mt-6 font-headline text-2xl font-black uppercase tracking-tighter text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Passwordless magic link. Use the same email your landlord invited, or
          your landlord account email.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={formInputClassName}
            placeholder="you@example.com"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send magic link"}
        </Button>
        {message ? (
          <p
            className={
              status === "error" ? "text-sm text-accent-magenta" : "text-sm text-ink-secondary"
            }
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
