import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t("common.appName")}
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">{t("nav.profile")}</Link>
              </Button>
              <LogoutButton label={t("nav.logout")} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{t("nav.signup")}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
