import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { routes } from "@/config/routes";
import { acceptLeaseInvite } from "@/server/repos/lease-invites.repo";

function getSupabaseUrlAndKey() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const inviteToken = searchParams.get("invite_token");
  const nextPath = searchParams.get("next") ?? routes.dashboard;

  const { url, key } = getSupabaseUrlAndKey();
  if (!url?.trim() || !key?.trim()) {
    return NextResponse.redirect(
      new URL(`${routes.login}?error=config`, request.url),
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`${routes.login}?error=auth`, request.url),
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (inviteToken && user?.email) {
    const displayName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      user.email.split("@")[0] ||
      "Tenant";

    const result = await acceptLeaseInvite({
      token: inviteToken,
      userId: user.id,
      userEmail: user.email,
      displayName,
    });

    if (result.ok) {
      return NextResponse.redirect(
        new URL(`/cases/${result.leaseId}`, request.url),
      );
    }
    return NextResponse.redirect(
      new URL(
        `${routes.login}?error=invite_${result.reason}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
