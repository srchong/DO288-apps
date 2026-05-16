import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { r2PublicUrl } from "@/lib/r2";
import type { PhotoRow } from "@/types/database";
import type { PhotoView } from "@/types/views";
import { PublicGallery } from "@/components/public-gallery";
import { CommentForm } from "@/components/comment-form";
import { GuestUploadDialog } from "@/components/guest-upload-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const format = await getFormatter();

  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!album) notFound();

  let backgroundUrl: string | null = null;
  if (album.background_id) {
    const { data: background } = await supabase
      .from("backgrounds")
      .select("preview_url")
      .eq("id", album.background_id)
      .single();
    backgroundUrl = background?.preview_url ?? null;
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", album.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  const photoViews: PhotoView[] = (photos ?? []).map((photo: PhotoRow) => ({
    id: photo.id,
    thumbUrl: r2PublicUrl(photo.r2_key_thumb),
    originalUrl: r2PublicUrl(photo.r2_key_original),
    panoUrl: photo.r2_key_pano ? r2PublicUrl(photo.r2_key_pano) : null,
    is360: photo.is_360,
    status: photo.status,
    uploadedBy: photo.uploaded_by,
  }));

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("album_id", album.id)
    .order("created_at", { ascending: false });
  const commentList = comments ?? [];

  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center"
      style={
        backgroundUrl
          ? { backgroundImage: `url(${backgroundUrl})` }
          : undefined
      }
    >
      <div className="min-h-screen bg-background/85 backdrop-blur-sm">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <span className="text-sm font-semibold tracking-tight">
              {t("common.appName")}
            </span>
            <LanguageSwitcher />
          </div>
        </header>

        <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
          <section className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {album.title}
            </h1>
            <p className="text-muted-foreground">
              {t(`eventTypes.${album.event_type}`)}
              {album.event_date
                ? ` · ${format.dateTime(new Date(album.event_date), {
                    dateStyle: "long",
                  })}`
                : ""}
            </p>
            {album.allow_guest_uploads && (
              <GuestUploadDialog slug={album.slug} />
            )}
          </section>

          <section>
            <PublicGallery photos={photoViews} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("publicAlbum.commentsTitle")}
            </h2>
            <CommentForm albumId={album.id} />
            <div className="flex flex-col gap-3">
              {commentList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("publicAlbum.noComments")}
                </p>
              ) : (
                commentList.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-card rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {comment.author_name}
                      </span>
                      <time className="text-muted-foreground text-xs">
                        {format.dateTime(new Date(comment.created_at), {
                          dateStyle: "medium",
                        })}
                      </time>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
