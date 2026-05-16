// Genera los audios placeholder de la app:
//   - Fonemas: voz TTS on-device (CLI supertonic) -> public/audio/phonemes/*.wav
//   - SFX:     tonos sintetizados en Node puro     -> public/audio/sfx/*.wav
//
// Los audios de fonemas son PLACEHOLDERS: una voz TTS pronuncia una palabra
// de ejemplo. Se sustituirán por grabaciones de hablantes nativos sin tocar
// la app, ya que las rutas viven en el manifiesto src/scripts/data/phonemes.ts.
//
// Requisito para los fonemas: el CLI `supertonic` (pip install supertonic).
// La primera ejecución descarga el modelo desde HuggingFace una sola vez;
// después funciona sin red. Los SFX se generan siempre, sin red.
//
// Uso:  npm run generate-audio              (omite archivos ya existentes)
//       npm run generate-audio -- --force   (regenera todo)

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHONEMES } from '../src/scripts/data/phonemes.ts';

const execFileAsync = promisify(execFile);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHONEME_DIR = join(ROOT, 'public', 'audio', 'phonemes');
const SFX_DIR = join(ROOT, 'public', 'audio', 'sfx');
const VOICE = 'F1';
const LANG = 'pt';
const FORCE = process.argv.includes('--force');
const SAMPLE_RATE = 44100;
// Margen amplio: la primera ejecución de supertonic descarga el modelo y
// emite barras de progreso por stderr.
const EXEC_OPTS = { maxBuffer: 16 * 1024 * 1024 };

// --- Generación de fonemas con TTS ----------------------------------------

async function supertonicAvailable() {
  try {
    await execFileAsync('supertonic', ['version'], EXEC_OPTS);
    return true;
  } catch {
    return false;
  }
}

async function generatePhonemes() {
  mkdirSync(PHONEME_DIR, { recursive: true });
  if (!(await supertonicAvailable())) {
    console.warn('!  CLI `supertonic` no encontrado: se omiten los audios de fonemas.');
    console.warn('   Instálalo con `pip install supertonic` y vuelve a ejecutar este script.');
    return;
  }
  for (const phoneme of PHONEMES) {
    const out = join(PHONEME_DIR, phoneme.audioFile);
    if (existsSync(out) && statSync(out).size > 0 && !FORCE) {
      console.log(`·  ${phoneme.audioFile} (ya existe)`);
      continue;
    }
    // Escritura atómica: se genera en un .tmp.wav y solo se promueve al
    // nombre final si la síntesis termina sin error.
    const tmp = out.replace(/\.wav$/, '.tmp.wav');
    try {
      await execFileAsync(
        'supertonic',
        ['tts', phoneme.ttsText, '-o', tmp, '--lang', LANG, '--voice', VOICE],
        EXEC_OPTS,
      );
      renameSync(tmp, out);
      console.log(`OK ${phoneme.audioFile}  «${phoneme.ttsText}»`);
    } catch (err) {
      rmSync(tmp, { force: true });
      throw err;
    }
  }
}

// --- Generación de SFX (síntesis offline) ---------------------------------

// Mezcla aditiva de tonos senoidales con fade para evitar clicks.
function synth(events, totalMs) {
  const total = Math.round((totalMs / 1000) * SAMPLE_RATE);
  const out = new Float32Array(total);
  for (const ev of events) {
    const start = Math.round((ev.startMs / 1000) * SAMPLE_RATE);
    const len = Math.round((ev.durationMs / 1000) * SAMPLE_RATE);
    const fade = Math.min(Math.round(0.012 * SAMPLE_RATE), Math.floor(len / 2));
    for (let i = 0; i < len && start + i < total; i++) {
      let env = ev.gain;
      if (i < fade) env *= i / fade;
      else if (i > len - fade) env *= (len - i) / fade;
      out[start + i] += env * Math.sin((2 * Math.PI * ev.freq * i) / SAMPLE_RATE);
    }
  }
  for (let i = 0; i < total; i++) out[i] = Math.max(-1, Math.min(1, out[i]));
  return out;
}

// Codifica muestras Float32 [-1, 1] en un buffer WAV PCM 16-bit mono.
function renderWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    data.writeInt16LE(((s < 0 ? s * 0x8000 : s * 0x7fff) | 0), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits por muestra
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function generateSfx() {
  mkdirSync(SFX_DIR, { recursive: true });
  // Acierto: dos notas ascendentes (D5 -> A5), brillante y breve.
  const success = synth(
    [
      { freq: 587.33, startMs: 0, durationMs: 170, gain: 0.5 },
      { freq: 880.0, startMs: 140, durationMs: 240, gain: 0.5 },
    ],
    400,
  );
  // Reintento: una nota grave y suave, sin connotación negativa fuerte.
  const retry = synth([{ freq: 233.08, startMs: 0, durationMs: 260, gain: 0.4 }], 280);

  writeFileSync(join(SFX_DIR, 'success.wav'), renderWav(success));
  writeFileSync(join(SFX_DIR, 'retry.wav'), renderWav(retry));
  console.log('OK sfx/success.wav');
  console.log('OK sfx/retry.wav');
}

// --- Entrada ---------------------------------------------------------------

async function main() {
  console.log(FORCE ? 'Regenerando todos los audios...' : 'Generando audios faltantes...');
  generateSfx();
  await generatePhonemes();
  console.log('Listo.');
}

main().catch((err) => {
  console.error('Fallo al generar audios:', err);
  process.exitCode = 1;
});
