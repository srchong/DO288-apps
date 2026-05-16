"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Orbit } from "lucide-react";
import type { PhotoView } from "@/types/views";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const Sphere360Viewer = dynamic(
  () => import("@/components/sphere-360-viewer"),
  { ssr: false },
);

export function PublicGallery({ photos }: { photos: PhotoView[] }) {
  const t = useTranslations();
  const [active, setActive] = useState<PhotoView | null>(null);
  const [highQuality, setHighQuality] = useState(false);

  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        {t("photos.empty")}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => {
              setActive(photo);
              setHighQuality(false);
            }}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <img
              src={photo.thumbUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {photo.is360 && (
              <Badge className="absolute left-2 top-2 gap-1">
                <Orbit className="size-3" />
                {t("photos.is360")}
              </Badge>
            )}
          </button>
        ))}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          {active?.is360 ? (
            <div className="flex flex-col gap-3">
              <DialogTitle className="text-base">
                {t("photos.is360")}
              </DialogTitle>
              <div className="h-[60vh] w-full overflow-hidden rounded-md bg-black">
                <Sphere360Viewer
                  key={highQuality ? "hq" : "std"}
                  src={
                    highQuality
                      ? active.originalUrl
                      : (active.panoUrl ?? active.originalUrl)
                  }
                />
              </div>
              {!highQuality && active.panoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setHighQuality(true)}
                >
                  {t("photos.viewHighQuality")}
                </Button>
              )}
            </div>
          ) : (
            active && (
              <div className="flex flex-col gap-3">
                <DialogTitle className="sr-only">
                  {t("publicAlbum.commentsTitle")}
                </DialogTitle>
                <img
                  src={active.originalUrl}
                  alt=""
                  className="max-h-[75vh] w-full rounded-md object-contain"
                />
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
