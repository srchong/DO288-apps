"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { uploadGuestPhoto, uploadOwnerPhoto } from "@/actions/photos";
import { initialFormState } from "@/actions/types";
import { cn } from "@/lib/utils";

type UploaderProps = {
  mode: "owner" | "guest";
  /** Album id for owner uploads, album slug for guest uploads. */
  target: string;
  onDone?: () => void;
};

export function PhotoUploader({ mode, target, onDone }: UploaderProps) {
  const t = useTranslations();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [, startTransition] = useTransition();

  async function handleFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    setProgress({ done: 0, total: files.length });
    let failures = 0;

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append(mode === "owner" ? "albumId" : "slug", target);
      formData.append("file", files[i]);

      const action = mode === "owner" ? uploadOwnerPhoto : uploadGuestPhoto;
      const result = await action(initialFormState, formData);
      if (result.errorKey) failures++;
      setProgress({ done: i + 1, total: files.length });
    }

    setProgress(null);
    if (failures > 0) {
      toast.error(t("photos.uploadError"));
    } else {
      toast.success(
        mode === "owner"
          ? t("photos.uploadDone")
          : t("publicAlbum.guestUploadDone"),
      );
    }
    startTransition(() => router.refresh());
    onDone?.();
  }

  const busy = progress !== null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!busy) void handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors",
        dragOver ? "border-ring bg-accent" : "border-input hover:bg-accent/50",
        busy && "pointer-events-none opacity-70",
      )}
    >
      <ImagePlus className="text-muted-foreground size-8" />
      {busy ? (
        <p className="text-sm">
          {t("photos.uploading", {
            done: progress.done,
            total: progress.total,
          })}
        </p>
      ) : (
        <>
          <p className="text-sm font-medium">{t("photos.upload")}</p>
          <p className="text-muted-foreground text-xs">
            {t("photos.uploadHint")}
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
