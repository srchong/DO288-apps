# Evently (placeholder)

SaaS de álbumes de fotos para eventos con estética nostálgica, soporte para
fotos 360°, subida moderada de fotos por invitados y comentarios protegidos
con captcha. Mercado: México, LATAM y EE.UU. Multi-idioma (ES/EN).

Este es el código de la **Fase 1** (módulo de fotos/álbumes). El roadmap
completo está en `../CLAUDE.md`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · next-intl ·
Supabase (Postgres + Auth) · Cloudflare R2 · sharp · react-photo-sphere-viewer ·
Cloudflare Turnstile.

## Requisitos

- Node.js 20+
- Un proyecto de [Supabase](https://supabase.com)
- Un bucket de [Cloudflare R2](https://developers.cloudflare.com/r2/) público
- Claves de [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

## Puesta en marcha

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia las variables de entorno y rellénalas:

   ```bash
   cp .env.example .env.local
   ```

3. Aplica las migraciones de base de datos en tu proyecto Supabase. Con la
   [CLI de Supabase](https://supabase.com/docs/guides/cli):

   ```bash
   supabase db push
   ```

   O ejecuta en orden los archivos de `supabase/migrations/` desde el editor
   SQL del panel de Supabase.

4. En el panel de Supabase, habilita el proveedor **Google** en
   Authentication → Providers, y añade `<tu-dominio>/auth/callback` como URL
   de redirección.

5. Configura el bucket de R2 como público y apunta `R2_PUBLIC_URL` a su
   dominio público (o dominio personalizado).

6. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) — redirige a `/es`.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servir el build
- `npm run lint` — linter

## Estructura

```
src/
  actions/      Server Actions (auth, álbumes, fotos, comentarios)
  app/[locale]/ Rutas con prefijo de idioma (/es, /en)
  app/auth/     Callback de OAuth
  components/   Componentes de UI y de funcionalidad
  i18n/         Configuración de next-intl
  lib/          Supabase, R2, procesamiento de imágenes, utilidades
  types/        Tipos de base de datos y vistas
messages/       Traducciones (es.json, en.json)
supabase/       Migraciones SQL versionadas
```

## Notas de la Fase 1

- Las páginas públicas de álbum (`/[locale]/a/[slug]`) no requieren login.
- Las fotos 360° se detectan por relación de aspecto 2:1 + metadata XMP GPano
  y se sirven en una versión reducida de 4096px.
- Las subidas de invitados entran como `pending` y requieren moderación.
- RLS está activado en todas las tablas; las escrituras de origen no confiable
  (invitados, comentarios) pasan por Server Actions con la service-role key.
