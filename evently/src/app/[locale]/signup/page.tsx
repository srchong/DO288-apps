import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthForm mode="signup" />
      </main>
    </div>
  );
}
