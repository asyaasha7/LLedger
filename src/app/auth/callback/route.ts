import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { routes } from "@/config/routes";
import { acceptLeaseInvite } from "@/server/repos/lease-invites.repo";
import { publishCaseEventToHedera } from "@/server/services/publish-case-event-hedera";

function getSupabaseUrlAndKey() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

/**
 * PKCE cookies from exchangeCodeForSession must be copied onto the same
 * NextResponse as the redirect — `cookies()` in Route Handlers does not attach
 * Set-Cookie to redirects (common cause of `?error=auth` after magic link).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const inviteToken = requestUrl.searchParams.get("invite_token");
  const nextPath = requestUrl.searchParams.get("next") ?? routes.dashboard;

  const { url, key } = getSupabaseUrlAndKey();
  if (!url?.trim() || !key?.trim()) {
    return NextResponse.redirect(
      new URL(`${routes.login}?error=config`, request.url),
    );
  }

  const merged = new Map<string, { name: string; value: string }>();
  for (const c of request.cookies.getAll()) {
    merged.set(c.name, { name: c.name, value: c.value });
  }

  const toSet: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return [...merged.values()];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          merged.set(name, { name, value });
          toSet.push({ name, value, options });
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);
      return NextResponse.redirect(
        new URL(`${routes.login}?error=auth`, request.url),
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let redirectPath: string;

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
      if (result.tenantJoinedCaseEventId) {
        await publishCaseEventToHedera(result.tenantJoinedCaseEventId);
      }
      redirectPath = `/cases/${result.leaseId}`;
    } else {
      redirectPath = `${routes.login}?error=invite_${result.reason}`;
    }
  } else {
    redirectPath = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  }

  const response = NextResponse.redirect(
    new URL(redirectPath, requestUrl.origin),
  );
  for (const { name, value, options } of toSet) {
    response.cookies.set(name, value, options);
  }
  return response;
}
