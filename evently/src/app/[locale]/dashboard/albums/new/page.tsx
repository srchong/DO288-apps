import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumForm } from "@/components/album-form";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewAlbumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const { data: backgrounds } = await supabase
    .from("backgrounds")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/dashboard"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("common.back")}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("album.newTitle")}
      </h1>
      <Card>
        <CardContent>
          <AlbumForm mode="create" backgrounds={backgrounds ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
