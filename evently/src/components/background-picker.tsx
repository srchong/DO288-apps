"use client";

import { useTranslations } from "next-intl";
import type { BackgroundRow } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function BackgroundPicker({
  backgrounds,
  value,
  onChange,
}: {
  backgrounds: BackgroundRow[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useTranslations("backgrounds");

  const categoryLabel: Record<string, string> = {
    wedding: t("categoryWedding"),
    party: t("categoryParty"),
    kids: t("categoryKids"),
    corporate: t("categoryCorporate"),
    classic: t("categoryClassic"),
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {backgrounds.map((bg) => {
        const selected = bg.id === value;
        return (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChange(selected ? null : bg.id)}
            aria-pressed={selected}
            className={cn(
              "group relative overflow-hidden rounded-lg border text-left transition-all",
              selected
                ? "ring-2 ring-ring border-ring"
                : "hover:border-foreground/30",
            )}
          >
            <img
              src={bg.preview_url}
              alt={bg.name}
              className="h-20 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <span className="truncate text-xs font-medium">{bg.name}</span>
              <Badge
                variant={bg.is_free ? "secondary" : "default"}
                className="shrink-0"
              >
                {bg.is_free ? t("free") : t("premium")}
              </Badge>
            </div>
            <span className="text-muted-foreground px-2 pb-1.5 text-[10px]">
              {categoryLabel[bg.category]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
