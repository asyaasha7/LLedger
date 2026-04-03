import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { isDatabaseConfigured } from "@/server/db/client";
import { getMembershipRole } from "@/server/repos/case-memberships.repo";
import { createLeaseInvite } from "@/server/repos/lease-invites.repo";
import { createServiceRoleClient } from "@/utils/supabase/service";

function siteOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> },
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }
  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaseId } = await context.params;
  const role = await getMembershipRole(leaseId, user.id);
  if (role !== "landlord") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const { token } = await createLeaseInvite({
    leaseId,
    email,
    createdByUserId: user.id,
  });

  const origin = siteOrigin(request);
  const redirectTo = `${origin}/auth/callback?invite_token=${encodeURIComponent(token)}`;

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
        inviteLink: `${redirectTo}&code_hint=use_supabase_magic_link`,
        token,
      },
      { status: 503 },
    );
  }

  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (inviteErr) {
    const { data, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (linkErr || !data?.properties?.action_link) {
      console.error(inviteErr, linkErr);
      return NextResponse.json(
        {
          error: "Could not send invite email",
          detail: inviteErr.message,
          inviteLink: null,
          token,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      magicLink: data.properties.action_link,
      message:
        "User may already exist — use magicLink for this session or check email.",
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Invite email sent (check inbox and spam).",
  });
}
