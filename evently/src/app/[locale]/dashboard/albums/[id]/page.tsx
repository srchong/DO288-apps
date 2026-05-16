import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { r2PublicUrl } from "@/lib/r2";
import type { PhotoRow } from "@/types/database";
import type { PhotoView } from "@/types/views";
import { AlbumForm } from "@/components/album-form";
import { PhotoUploader } from "@/components/photo-uploader";
import { OwnerPhotoGrid } from "@/components/owner-photo-grid";
import { ModerationQueue } from "@/components/moderation-queue";
import { DeleteAlbumButton } from "@/components/delete-album-button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function toPhotoView(photo: PhotoRow): PhotoView {
  return {
    id: photo.id,
    thumbUrl: r2PublicUrl(photo.r2_key_thumb),
    originalUrl: r2PublicUrl(photo.r2_key_original),
    panoUrl: photo.r2_key_pano ? r2PublicUrl(photo.r2_key_pano) : null,
    is360: photo.is_360,
    status: photo.status,
    uploadedBy: photo.uploaded_by,
  };
}

export default async function AlbumEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .eq("client_id", user!.id)
    .single();
  if (!album) notFound();

  const { data: backgrounds } = await supabase
    .from("backgrounds")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", id)
    .order("created_at", { ascending: false });
  const photoList = photos ?? [];
  const approved = photoList
    .filter((photo) => photo.status === "approved")
    .map(toPhotoView);
  const pending = photoList
    .filter((photo) => photo.status === "pending")
    .map(toPhotoView);

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const publicUrl = `${proto}://${host}/${locale}/a/${album.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("common.back")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {album.title}
          </h1>
          <div className="flex items-center gap-2">
            <CopyLinkButton url={publicUrl} />
            <Button asChild variant="outline" size="sm">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t("album.publicLink")}
              </a>
            </Button>
            <DeleteAlbumButton albumId={album.id} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("album.tabSettings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AlbumForm
            mode="edit"
            album={album}
            backgrounds={backgrounds ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("album.tabPhotos")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PhotoUploader mode="owner" target={album.id} />
          <OwnerPhotoGrid photos={approved} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("album.tabModeration")}
            {pending.length > 0 && <Badge>{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModerationQueue photos={pending} />
        </CardContent>
      </Card>
    </div>
  );
}
