"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./types";

export async function signInWithPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = await getLocale();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { errorKey: "errors.invalidCredentials" };

  redirect(`/${locale}/dashboard`);
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const locale = await getLocale();

  if (!email || !password) return { errorKey: "errors.required" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) return { errorKey: "errors.generic" };

  // When email confirmation is disabled, sign-up returns a live session.
  if (data.session) redirect(`/${locale}/dashboard`);

  return { successKey: "auth.checkEmail" };
}

export async function signInWithGoogle(): Promise<void> {
  const locale = await getLocale();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    `https://${headerList.get("host") ?? "localhost:3000"}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect(`/${locale}/login`);

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const { error } = await supabase
    .from("clients")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (error) return { errorKey: "errors.generic" };

  return { successKey: "profile.saved" };
}
