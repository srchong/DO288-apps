"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/r2";
import { isEventType } from "@/lib/event-types";
import { generateSlug } from "@/lib/slug";
import type { FormState } from "./types";

function readAlbumForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "");
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const backgroundIdRaw = String(formData.get("backgroundId") ?? "").trim();
  const allowGuestUploads = formData.get("allowGuestUploads") === "true";

  return {
    title,
    eventType,
    eventDate: eventDateRaw || null,
    backgroundId: backgroundIdRaw || null,
    allowGuestUploads,
  };
}

export async function createAlbum(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const form = readAlbumForm(formData);
  if (!form.title || !isEventType(form.eventType)) {
    return { errorKey: "errors.required" };
  }

  const { data, error } = await supabase
    .from("albums")
    .insert({
      client_id: user.id,
      slug: generateSlug(),
      title: form.title,
      event_type: form.eventType,
      event_date: form.eventDate,
      background_id: form.backgroundId,
      allow_guest_uploads: form.allowGuestUploads,
    })
    .select("id")
    .single();
  if (error || !data) return { errorKey: "errors.generic" };

  redirect(`/${locale}/dashboard/albums/${data.id}`);
}

export async function updateAlbum(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const albumId = String(formData.get("albumId") ?? "");
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const form = readAlbumForm(formData);
  if (!form.title || !isEventType(form.eventType)) {
    return { errorKey: "errors.required" };
  }

  // RLS restricts the update to the owner; the client_id filter is belt-and-braces.
  const { error } = await supabase
    .from("albums")
    .update({
      title: form.title,
      event_type: form.eventType,
      event_date: form.eventDate,
      background_id: form.backgroundId,
      allow_guest_uploads: form.allowGuestUploads,
      updated_at: new Date().toISOString(),
    })
    .eq("id", albumId)
    .eq("client_id", user.id);
  if (error) return { errorKey: "errors.generic" };

  revalidatePath(`/${locale}/dashboard/albums/${albumId}`);
  return { successKey: "album.updated" };
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // Remove the stored objects before the rows cascade away.
  const { data: photos } = await supabase
    .from("photos")
    .select("r2_key_original, r2_key_thumb, r2_key_pano")
    .eq("album_id", albumId)
    .eq("client_id", user!.id);

  for (const photo of photos ?? []) {
    await deleteFromR2(photo.r2_key_original).catch(() => {});
    await deleteFromR2(photo.r2_key_thumb).catch(() => {});
    if (photo.r2_key_pano) {
      await deleteFromR2(photo.r2_key_pano).catch(() => {});
    }
  }

  await supabase
    .from("albums")
    .delete()
    .eq("id", albumId)
    .eq("client_id", user!.id);

  redirect(`/${locale}/dashboard`);
}
