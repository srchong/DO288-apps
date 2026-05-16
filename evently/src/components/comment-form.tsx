"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createComment } from "@/actions/comments";
import { initialFormState } from "@/actions/types";
import { Turnstile } from "@/components/turnstile";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ albumId }: { albumId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction] = useActionState(createComment, initialFormState);
  const [token, setToken] = useState<string | null>(null);
  const [widgetKey, setWidgetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.errorKey) toast.error(t(state.errorKey));
    if (state.successKey) {
      toast.success(t(state.successKey));
      formRef.current?.reset();
      setToken(null);
      setWidgetKey((key) => key + 1);
      router.refresh();
    }
  }, [state, t, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="albumId" value={albumId} />
      <input type="hidden" name="captchaToken" value={token ?? ""} />
      <Input
        name="authorName"
        required
        maxLength={80}
        placeholder={t("comments.namePlaceholder")}
      />
      <Textarea
        name="body"
        required
        maxLength={2000}
        placeholder={t("comments.textPlaceholder")}
      />
      <Turnstile key={widgetKey} onChange={setToken} />
      {!token && (
        <p className="text-muted-foreground text-xs">
          {t("comments.captchaRequired")}
        </p>
      )}
      <SubmitButton
        className="self-start"
        disabled={!token}
        pendingLabel={t("common.loading")}
      >
        {t("comments.submit")}
      </SubmitButton>
    </form>
  );
}
