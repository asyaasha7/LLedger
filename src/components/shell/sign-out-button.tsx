"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { routes } from "@/config/routes";
import { createClient } from "@/utils/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 px-4 py-2 text-left font-headline text-[10px] font-bold uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push(routes.login);
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
      Sign out
    </button>
  );
}
