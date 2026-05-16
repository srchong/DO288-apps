import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: albums } = await supabase
    .from("albums")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });
  const albumList = albums ?? [];

  const counts = new Map<string, { approved: number; pending: number }>();
  for (const album of albumList) {
    counts.set(album.id, { approved: 0, pending: 0 });
  }
  if (albumList.length > 0) {
    const { data: photoRows } = await supabase
      .from("photos")
      .select("album_id, status")
      .in(
        "album_id",
        albumList.map((album) => album.id),
      );
    for (const row of photoRows ?? []) {
      const entry = counts.get(row.album_id);
      if (!entry) continue;
      if (row.status === "approved") entry.approved += 1;
      else if (row.status === "pending") entry.pending += 1;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <Button asChild>
          <Link href="/dashboard/albums/new">
            <Plus className="size-4" />
            {t("dashboard.newAlbum")}
          </Link>
        </Button>
      </div>

      {albumList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("dashboard.empty")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albumList.map((album) => {
            const entry = counts.get(album.id) ?? {
              approved: 0,
              pending: 0,
            };
            return (
              <Link
                key={album.id}
                href={`/dashboard/albums/${album.id}`}
                className="block"
              >
                <Card className="h-full transition-colors hover:border-foreground/30">
                  <CardHeader>
                    <CardTitle className="truncate">{album.title}</CardTitle>
                    <CardDescription>
                      {t(`eventTypes.${album.event_type}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {t("dashboard.photosCount", { count: entry.approved })}
                    </Badge>
                    {entry.pending > 0 && (
                      <Badge>
                        {t("dashboard.pendingCount", {
                          count: entry.pending,
                        })}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
