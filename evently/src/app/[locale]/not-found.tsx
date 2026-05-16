import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("publicAlbum.notFound")}
      </h1>
      <Button asChild>
        <Link href="/">{t("nav.home")}</Link>
      </Button>
    </div>
  );
}
