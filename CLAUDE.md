# CLAUDE.md — Evently (placeholder)

## Qué es este proyecto

SaaS de álbumes de fotos para eventos (estética fotolog) + invitaciones digitales
con widgets configurables + RSVP por WhatsApp. Mercado: México, LATAM, EE.UU.
Cobros en USD. Multi-idioma (ES/EN).

## Stack

- Next.js 15 (App Router, RSC, Server Actions) + TypeScript estricto
- Tailwind + shadcn/ui
- next-intl (ES por defecto, EN)
- Supabase: Postgres + Auth + Storage + Edge Functions + Realtime
- Cloudflare R2 para fotos y thumbnails (S3-compatible)
- sharp para procesar imágenes
- react-photo-sphere-viewer para 360°
- @dnd-kit para el constructor de widgets
- Cloudflare Turnstile para captcha
- Paddle (Merchant of Record) para pagos
- WhatsApp Cloud API (Meta) para RSVP

## Convenciones de código

- TypeScript estricto, sin `any`.
- Server Components por defecto; Client Components solo cuando se necesita interactividad.
- Mutaciones vía Server Actions, no API routes, salvo webhooks.
- Todo string visible pasa por next-intl. Cero texto hardcodeado.
- Componentes en PascalCase, archivos de utilidades en kebab-case.
- Nombres de columnas de DB en snake_case.

## Multi-tenancy y seguridad

- Cada cliente tiene un `client_id`. Toda tabla con datos del cliente lleva `client_id`.
- Row Level Security (RLS) activado en TODAS las tablas. Nada de datos sin política RLS.
- Cada invitación/álbum público se sirve por un slug corto, ej: `/a/jdk3j9`
- Las páginas públicas (álbum, invitación) NO requieren login.

## Reglas de imágenes

- Originales y thumbnails en R2. Egress gratis, por eso usamos R2.
- 360°: detectar por aspect 2:1 + XMP GPano. Generar versión 4096px en R2.
- Visor 360° con `next/dynamic` `ssr:false`.
- HEIC -> WebP en servidor.

## Modelo de planes (referencia, se implementa en Fase 3)

- Free: 1 evento, 50 fotos, retención corta, marca de agua.
- Lite (BYO Storage): el cliente conecta su Drive/Dropbox. ~$3.99/mes o $29/evento.
- Pro: storage propio en R2, ~$29/evento (6 meses), widgets premium.
- Premium: ~$79/evento (12 meses), todos los widgets incluido 360° y RSVP WhatsApp.

## Fases de construcción

- Fase 1 (ACTUAL): auth + álbumes + subida de fotos + fondos + visor 360° + comentarios con captcha.
- Fase 2: constructor de invitaciones con widgets (@dnd-kit) + libro de visitas.
- Fase 3: planes y pagos con Paddle + panel admin + límites de storage.
- Fase 4: RSVP por WhatsApp Cloud API + módulo de invitados.
- Fase 5: BYO Storage (Dropbox primero, luego OneDrive, luego Google Drive scope `drive.file`).

## Lo que NO se hace todavía

- No iCloud (imposible desde web app).
- No Google Drive con scope amplio (evitar verificación CASA cara).
- No construir fases futuras antes de terminar la actual.

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run lint` — linter
- (Agregar más conforme se definan)

## Variables de entorno (.env.local — nunca commitear)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

## Decisiones tomadas durante la construcción

- El código de la app vive en la subcarpeta `evently/` del repositorio
  (el repo ya contenía apps de ejemplo no relacionadas). Este `CLAUDE.md`
  permanece en la raíz.
- Next.js fijado a la versión **15** (`create-next-app@latest` instalaba 16).
- Tailwind **v4** (config vía CSS, sin `tailwind.config.ts`).
- La site key de Turnstile se expone como `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  porque el widget del navegador la necesita.
- `heic-convert` se añadió como dependencia: `sharp` solo decodifica HEIC si
  su `libvips` se compiló con `libheif`, lo cual no está garantizado.
