"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import type { FormState } from "./types";

export async function createComment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const albumId = String(formData.get("albumId") ?? "");
  const photoIdRaw = String(formData.get("photoId") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "");

  if (!authorName || !body || !albumId) {
    return { errorKey: "errors.required" };
  }

  const headerList = await headers();
  const remoteIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const passed = await verifyTurnstile(captchaToken, remoteIp);
  if (!passed) return { errorKey: "comments.captchaFailed" };

  // The album is confirmed to exist before inserting with the service role.
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("id")
    .eq("id", albumId)
    .single();
  if (!album) return { errorKey: "errors.generic" };

  const admin = createAdminClient();
  const { error } = await admin.from("comments").insert({
    album_id: albumId,
    photo_id: photoIdRaw || null,
    author_name: authorName.slice(0, 80),
    body: body.slice(0, 2000),
  });
  if (error) return { errorKey: "errors.generic" };

  return { successKey: "comments.submitted" };
}
