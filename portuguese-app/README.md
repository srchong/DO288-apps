# Aprender Portugués — MVP

App web para aprender portugués brasileño (pt-BR). Pedagogía: mezcla de
"Silent Way" y producción oral rápida — el usuario no lee gramática, interactúa
con estímulos visuales y habla desde el primer segundo.

## Vistas

- **Vista 1 — Color Chart (Silent Way):** cuadrícula de fichas de color; al
  pulsar suena un fonema nativo y se indica "Es tu turno de repetir".
- **Vista 2 — Práctica de Vocabulario:** una palabra en pantalla y un botón
  push-to-talk; al soltar, el audio se envía a un evaluador fonético (mockeado)
  que responde éxito o reintento.

## Stack

Astro con salida 100% estática (sin adapter, sin SSR). La lógica interactiva
son módulos TypeScript vanilla cargados desde los componentes `.astro`.
Pensado para desplegar en Cloudflare Pages.

## Desarrollo

```sh
npm install
npm run dev            # servidor de desarrollo
npm run generate-audio # genera los audios placeholder (TTS pt-BR)
npm run build          # genera dist/ estático
npm run preview        # sirve dist/ localmente
```

## Despliegue

`npm run build` produce `dist/`, que se publica tal cual en Cloudflare Pages
(build command `npm run build`, output directory `dist`).

## Convenciones

- Código y nombres de identificadores en inglés; comentarios en español.
- TypeScript estricto.
- Accesibilidad básica: los botones solo-color llevan `aria-label` y los
  cambios de estado se anuncian con `aria-live`.
