"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_FILE_BYTES,
  processImage,
  type ProcessedImage,
} from "@/lib/images";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";
import { generateAssetHash } from "@/lib/slug";
import type { FormState } from "./types";

type UploadedKeys = {
  original: string;
  thumb: string;
  pano: string | null;
};

// Pushes the processed variants to R2 under an immutable, hashed key prefix.
async function storeVariants(
  clientId: string,
  albumId: string,
  processed: ProcessedImage,
): Promise<UploadedKeys> {
  const hash = generateAssetHash();
  const prefix = `photos/${clientId}/${albumId}/${hash}`;

  const originalKey = `${prefix}/original.${processed.original.extension}`;
  const thumbKey = `${prefix}/thumb.webp`;

  await uploadToR2(
    originalKey,
    processed.original.buffer,
    processed.original.contentType,
  );
  await uploadToR2(
    thumbKey,
    processed.thumbnail.buffer,
    processed.thumbnail.contentType,
  );

  let panoKey: string | null = null;
  if (processed.pano) {
    panoKey = `${prefix}/pano.webp`;
    await uploadToR2(panoKey, processed.pano.buffer, processed.pano.contentType);
  }

  return { original: originalKey, thumb: thumbKey, pano: panoKey };
}

async function readImageFile(
  formData: FormData,
): Promise<{ buffer: Buffer; name: string } | { errorKey: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errorKey: "errors.invalidFileType" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { errorKey: "errors.fileTooLarge" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, name: file.name };
}

export async function uploadOwnerPhoto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const albumId = String(formData.get("albumId") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const { data: album } = await supabase
    .from("albums")
    .select("id")
    .eq("id", albumId)
    .eq("client_id", user.id)
    .single();
  if (!album) return { errorKey: "errors.unauthorized" };

  const fileResult = await readImageFile(formData);
  if ("errorKey" in fileResult) return { errorKey: fileResult.errorKey };

  let processed: ProcessedImage;
  try {
    processed = await processImage(fileResult.buffer, fileResult.name);
  } catch {
    return { errorKey: "errors.invalidFileType" };
  }

  const keys = await storeVariants(user.id, albumId, processed);

  const { error } = await supabase.from("photos").insert({
    album_id: albumId,
    client_id: user.id,
    r2_key_original: keys.original,
    r2_key_thumb: keys.thumb,
    r2_key_pano: keys.pano,
    is_360: processed.is360,
    width: processed.width,
    height: processed.height,
    status: "approved",
    uploaded_by: "client",
  });
  if (error) return { errorKey: "errors.generic" };

  return { successKey: "photos.uploadDone" };
}

export async function uploadGuestPhoto(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const slug = String(formData.get("slug") ?? "");

  // The album lookup uses the public anon client; RLS allows reading it.
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("id, client_id, allow_guest_uploads")
    .eq("slug", slug)
    .single();
  if (!album) return { errorKey: "errors.generic" };
  if (!album.allow_guest_uploads) {
    return { errorKey: "errors.guestUploadsDisabled" };
  }

  const fileResult = await readImageFile(formData);
  if ("errorKey" in fileResult) return { errorKey: fileResult.errorKey };

  let processed: ProcessedImage;
  try {
    processed = await processImage(fileResult.buffer, fileResult.name);
  } catch {
    return { errorKey: "errors.invalidFileType" };
  }

  const keys = await storeVariants(album.client_id, album.id, processed);

  // Guest uploads are written with the service role after the album was
  // confirmed to allow them; they land as 'pending' for moderation.
  const admin = createAdminClient();
  const { error } = await admin.from("photos").insert({
    album_id: album.id,
    client_id: album.client_id,
    r2_key_original: keys.original,
    r2_key_thumb: keys.thumb,
    r2_key_pano: keys.pano,
    is_360: processed.is360,
    width: processed.width,
    height: processed.height,
    status: "pending",
    uploaded_by: "guest",
  });
  if (error) return { errorKey: "errors.generic" };

  return { successKey: "publicAlbum.guestUploadDone" };
}

export async function moderatePhoto(
  photoId: string,
  approve: boolean,
): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const { data: photo, error } = await supabase
    .from("photos")
    .update({ status: approve ? "approved" : "rejected" })
    .eq("id", photoId)
    .eq("client_id", user.id)
    .select("album_id")
    .single();
  if (error || !photo) return { errorKey: "errors.generic" };

  revalidatePath(`/${locale}/dashboard/albums/${photo.album_id}`);
  return { successKey: approve ? "moderation.approved" : "moderation.rejected" };
}

export async function deletePhoto(photoId: string): Promise<FormState> {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errors.unauthorized" };

  const { data: photo } = await supabase
    .from("photos")
    .select("album_id, r2_key_original, r2_key_thumb, r2_key_pano")
    .eq("id", photoId)
    .eq("client_id", user.id)
    .single();
  if (!photo) return { errorKey: "errors.generic" };

  await deleteFromR2(photo.r2_key_original).catch(() => {});
  await deleteFromR2(photo.r2_key_thumb).catch(() => {});
  if (photo.r2_key_pano) {
    await deleteFromR2(photo.r2_key_pano).catch(() => {});
  }

  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("client_id", user.id);
  if (error) return { errorKey: "errors.generic" };

  revalidatePath(`/${locale}/dashboard/albums/${photo.album_id}`);
  return { successKey: "photos.uploadDone" };
}
