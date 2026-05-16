import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

// OAuth redirect target. Supabase sends the user here with a `code` to be
// exchanged for a session. This route is excluded from the i18n middleware.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/dashboard`,
  );
}
