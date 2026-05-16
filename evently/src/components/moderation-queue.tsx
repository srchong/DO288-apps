"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Orbit, X } from "lucide-react";
import { moderatePhoto } from "@/actions/photos";
import type { PhotoView } from "@/types/views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ModerationQueue({ photos }: { photos: PhotoView[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("moderation.empty")}</p>
    );
  }

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    const result = await moderatePhoto(id, approve);
    setBusyId(null);
    if (result.errorKey) {
      toast.error(t(result.errorKey));
      return;
    }
    if (result.successKey) toast.success(t(result.successKey));
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="flex items-center gap-3 rounded-lg border p-2"
        >
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md">
            <img
              src={photo.thumbUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            {photo.is360 && (
              <Badge className="absolute left-1 top-1 gap-1 px-1">
                <Orbit className="size-3" />
              </Badge>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-muted-foreground text-xs">
              {t("moderation.uploadedBy")}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === photo.id}
                onClick={() => decide(photo.id, true)}
              >
                <Check className="size-4" />
                {t("moderation.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === photo.id}
                onClick={() => decide(photo.id, false)}
              >
                <X className="size-4" />
                {t("moderation.reject")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
