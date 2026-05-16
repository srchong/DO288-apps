"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations("album");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(url);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      <Copy className="size-4" />
      {t("copyLink")}
    </Button>
  );
}
