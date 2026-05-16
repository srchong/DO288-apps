"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { PhotoUploader } from "@/components/photo-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GuestUploadDialog({ slug }: { slug: string }) {
  const t = useTranslations("publicAlbum");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" />
          {t("guestUpload")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("guestUploadTitle")}</DialogTitle>
          <DialogDescription>{t("guestUploadHint")}</DialogDescription>
        </DialogHeader>
        <PhotoUploader
          mode="guest"
          target={slug}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
