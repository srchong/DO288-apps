"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { signInWithGoogle, signInWithPassword, signUp } from "@/actions/auth";
import { initialFormState } from "@/actions/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations();
  const isLogin = mode === "login";
  const action = isLogin ? signInWithPassword : signUp;
  const [state, formAction] = useActionState(action, initialFormState);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.errorKey) toast.error(t(state.errorKey));
    if (state.successKey) toast.success(t(state.successKey));
  }, [state, t]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          {isLogin ? t("auth.loginTitle") : t("auth.signupTitle")}
        </CardTitle>
        <CardDescription>{t("common.appName")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">{t("auth.displayName")}</Label>
              <Input id="displayName" name="displayName" autoComplete="name" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          <SubmitButton
            className="w-full"
            pendingLabel={t("common.loading")}
          >
            {isLogin ? t("auth.loginButton") : t("auth.signupButton")}
          </SubmitButton>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("auth.orDivider")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogle}>
          <SubmitButton
            variant="outline"
            className="w-full"
            pendingLabel={t("common.loading")}
          >
            {t("auth.googleButton")}
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="text-foreground underline underline-offset-4"
          >
            {isLogin ? t("auth.goSignup") : t("auth.goLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
