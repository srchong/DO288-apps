"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Orbit, Trash2 } from "lucide-react";
import { deletePhoto } from "@/actions/photos";
import type { PhotoView } from "@/types/views";
import { Badge } from "@/components/ui/badge";

export function OwnerPhotoGrid({ photos }: { photos: PhotoView[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("photos.empty")}</p>
    );
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("photos.deleteConfirm"))) return;
    setDeletingId(id);
    const result = await deletePhoto(id);
    setDeletingId(null);
    if (result.errorKey) {
      toast.error(t(result.errorKey));
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative aspect-square overflow-hidden rounded-lg border"
        >
          <img
            src={photo.thumbUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          {photo.is360 && (
            <Badge className="absolute left-1.5 top-1.5 gap-1">
              <Orbit className="size-3" />
              360°
            </Badge>
          )}
          <button
            type="button"
            onClick={() => handleDelete(photo.id)}
            disabled={deletingId === photo.id}
            aria-label={t("photos.deletePhoto")}
            className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
