import Link from "next/link";
import "./globals.css";

// Global fallback for requests outside any known locale segment. It cannot know
// the user's language, so it stays minimal and bilingual.
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-2xl font-semibold">404</h1>
          <p className="text-sm text-neutral-500">
            Página no encontrada · Page not found
          </p>
          <Link href="/" className="text-sm underline underline-offset-4">
            Evently
          </Link>
        </div>
      </body>
    </html>
  );
}
