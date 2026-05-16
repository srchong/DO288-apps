"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createAlbum, updateAlbum } from "@/actions/albums";
import { initialFormState } from "@/actions/types";
import { EVENT_TYPES } from "@/lib/event-types";
import type { AlbumRow, BackgroundRow } from "@/types/database";
import { BackgroundPicker } from "@/components/background-picker";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function AlbumForm({
  mode,
  backgrounds,
  album,
}: {
  mode: "create" | "edit";
  backgrounds: BackgroundRow[];
  album?: AlbumRow;
}) {
  const t = useTranslations();
  const action = mode === "create" ? createAlbum : updateAlbum;
  const [state, formAction] = useActionState(action, initialFormState);

  const [eventType, setEventType] = useState<string>(
    album?.event_type ?? EVENT_TYPES[0],
  );
  const [allowGuest, setAllowGuest] = useState<boolean>(
    album?.allow_guest_uploads ?? false,
  );
  const [backgroundId, setBackgroundId] = useState<string | null>(
    album?.background_id ?? null,
  );

  const lastState = useRef(state);
  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.errorKey) toast.error(t(state.errorKey));
    if (state.successKey) toast.success(t(state.successKey));
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "edit" && album && (
        <input type="hidden" name="albumId" value={album.id} />
      )}
      <input type="hidden" name="eventType" value={eventType} />
      <input type="hidden" name="backgroundId" value={backgroundId ?? ""} />
      <input
        type="hidden"
        name="allowGuestUploads"
        value={String(allowGuest)}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">{t("album.name")}</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={album?.title ?? ""}
          placeholder={t("album.namePlaceholder")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>{t("album.eventType")}</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`eventTypes.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eventDate">{t("album.eventDate")}</Label>
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            defaultValue={album?.event_date ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("album.background")}</Label>
        <BackgroundPicker
          backgrounds={backgrounds}
          value={backgroundId}
          onChange={setBackgroundId}
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="allowGuest">{t("album.allowGuestUploads")}</Label>
          <span className="text-muted-foreground text-xs">
            {t("album.allowGuestUploadsHint")}
          </span>
        </div>
        <Switch
          id="allowGuest"
          checked={allowGuest}
          onCheckedChange={setAllowGuest}
        />
      </div>

      <SubmitButton className="self-start" pendingLabel={t("common.loading")}>
        {mode === "create" ? t("common.create") : t("common.save")}
      </SubmitButton>
    </form>
  );
}
