"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateProfile } from "@/actions/auth";
import { initialFormState } from "@/actions/types";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  email,
  displayName,
}: {
  email: string;
  displayName: string | null;
}) {
  const t = useTranslations();
  const [state, formAction] = useActionState(updateProfile, initialFormState);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.errorKey) toast.error(t(state.errorKey));
    if (state.successKey) toast.success(t(state.successKey));
  }, [state, t]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("profile.email")}</Label>
        <Input id="email" value={email} readOnly disabled />
        <span className="text-muted-foreground text-xs">
          {t("profile.emailReadonly")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t("profile.displayName")}</Label>
        <Input
          id="displayName"
          name="displayName"
          maxLength={80}
          defaultValue={displayName ?? ""}
        />
      </div>
      <SubmitButton className="self-start" pendingLabel={t("common.loading")}>
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}
