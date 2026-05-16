# CLAUDE.md — App Web para Aprender Portugués (MVP)

Guía para trabajar en este proyecto. Resume el plan acordado; consúltala antes
de añadir o modificar código.

## Visión del proyecto

Prototipo MVP de una app web para aprender **portugués brasileño (pt-BR)**.
Pedagogía: mezcla de "Silent Way" y producción oral rápida. El usuario no lee
gramática: interactúa con estímulos visuales y habla desde el primer segundo
(espíritu similar a Elsa Speak, pero para portugués).

Alcance MVP — **incluido**: Vista 1, Vista 2, navegación entre ambas, permisos
de micrófono y estados de error básicos. **Excluido**: cuentas de usuario,
progreso persistente, API real, analítica, i18n.

## Stack y restricciones

- **Astro** con `output: 'static'` — sin adapter, sin SSR. La salida `dist/` se
  despliega tal cual en **Cloudflare Pages**.
- El shell de página lo dan los `.astro`; la lógica interactiva son **módulos
  TypeScript vanilla** importados desde `<script>` en los componentes. No hay
  framework de UI.
- Latencia mínima: precarga de audios, sin dependencias pesadas innecesarias.
- **Sin backend real.** La evaluación fonética está mockeada detrás de la
  interfaz `PhoneticEvaluator` (ver abajo).
- Sin login ni base de datos. Como mucho `localStorage` si algo lo justifica.

## Convenciones

- Código y nombres de identificadores **en inglés**; comentarios **en español**.
- **TypeScript estricto** (`astro/tsconfigs/strict`).
- Accesibilidad básica: los botones solo-color necesitan `aria-label`, pero la
  etiqueta **no debe revelar la respuesta** — usar etiquetas genéricas
  ("Ficha de sonido 3") y anunciar cambios de estado con `aria-live`.
- Estructura de carpetas limpia; archivos pequeños y enfocados.

## Audio: Web Audio API vs MediaRecorder

- **Reproducción de fonemas (Vista 1):** `AudioContext` + `decodeAudioData` +
  `AudioBufferSourceNode`. Precargar todos los audios a `AudioBuffer` al
  arrancar para reproducir sin lag. El `AudioContext` nace *suspended* por la
  política de autoplay: hacer `resume()` en el primer gesto del usuario.
- **Captura de micrófono (Vista 2):** `MediaRecorder` sobre el `MediaStream` de
  `getUserMedia` → graba a `Blob` para enviar al evaluador.
- **Visualización (opcional):** `AnalyserNode` derivado de un
  `MediaStreamAudioSourceNode`. `MediaRecorder` no da datos de nivel en vivo.
- iOS Safari: AudioContext suspended hasta gesto; `MediaRecorder` usa mime
  distinto (`audio/mp4` vs `audio/webm`) — hacer feature-detection.

## Banco de audios

- **MVP:** placeholders generados por TTS on-device con el CLI `supertonic`
  (ONNX, voz `F1`, `--lang pt`) vía `scripts/generate-audio.mjs`. El modelo se
  descarga una vez desde HuggingFace; después funciona sin red. Son
  placeholders intercambiables por grabaciones nativas más adelante.
  Licencia: código MIT, modelo OpenRAIL-M (uso restringido — revisar antes de
  un lanzamiento comercial).
- **Sustitución futura:** audio nativo con licencia CC de Lingua Libre o
  Wikimedia Commons.
- **Formato:** `.wav` PCM 16-bit mono 44,1 kHz, clips cortos (~1,3 s).
- **Nombres:** `public/audio/phonemes/<slug>.wav` (slug en inglés, p. ej.
  `vowel-a-oral.wav`, `nasal-a.wav`). SFX en `public/audio/sfx/`
  (`success.wav`, `retry.wav`); son tonos sintetizados offline por
  `scripts/generate-audio.mjs`, sin red.
- Cada audio se declara en un manifiesto tipado (`src/scripts/data/phonemes.ts`);
  la app nunca referencia rutas sueltas.

## Evaluación fonética — abstracción intercambiable

`src/scripts/evaluation/PhoneticEvaluator.ts` define la interfaz:

```ts
interface PhoneticEvaluator {
  evaluate(input: { audio: Blob; targetWord: string }): Promise<EvaluationResult>;
}
```

`MockPhoneticEvaluator` la implementa con **latencia y tasa de éxito
configurables** (`minLatencyMs`/`maxLatencyMs`, `successRate`; defaults
600–1600 ms y 0.6). La UI depende solo de la interfaz, así que sustituir el
mock por una API real no exige tocar las vistas.

## Estructura de carpetas

```
portuguese-app/
  astro.config.mjs        # output: 'static'
  tsconfig.json           # extends astro/tsconfigs/strict
  public/
    _headers              # cache de /audio para Cloudflare Pages
    audio/{phonemes,sfx}/
  scripts/generate-audio.mjs   # genera audios placeholder (TTS)
  src/
    pages/index.astro     # shell de página única
    layouts/Base.astro
    components/{ColorChart,VocabularyPractice}.astro
    scripts/
      app.ts              # bootstrap + conmutación de vistas
      types.ts
      audio/{audioEngine,micRecorder,levelMeter}.ts
      evaluation/{PhoneticEvaluator,MockPhoneticEvaluator}.ts
      data/{phonemes,vocabulary}.ts
      ui/feedback.ts
    styles/global.css
```

## Comandos

```sh
npm run dev             # desarrollo
npm run generate-audio  # genera los audios placeholder
npm run build           # genera dist/ estático
npm run preview         # sirve dist/
npm run check           # type-check de Astro
```

## Plan de implementación por módulos

Se implementa **un módulo a la vez**; cada uno se aprueba antes de continuar.

- **Módulo 0** — Scaffold + este CLAUDE.md *(completado)*.
- **Módulo 1** — Datos de fonemas + generación de audio placeholder.
- **Módulo 2** — Motor de audio (reproducción, precarga, unlock).
- **Módulo 3** — Vista 1 "Color Chart".
- **Módulo 4** — Captura de micrófono + permisos.
- **Módulo 5** — `PhoneticEvaluator` + mock.
- **Módulo 6** — Vista 2 "Práctica de Vocabulario" (push-to-talk + feedback).
- **Módulo 7** — Navegación, accesibilidad y build para Cloudflare Pages.
