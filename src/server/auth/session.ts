import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
