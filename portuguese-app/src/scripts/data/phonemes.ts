import type { Phoneme } from '../types';

// Carpeta web (servida desde public/) donde viven los audios de fonemas.
export const PHONEME_AUDIO_BASE = '/audio/phonemes';

// Manifiesto de fonemas del portugués brasileño: 7 vocales orales + 5 nasales.
// La app referencia SIEMPRE este manifiesto, nunca rutas de audio sueltas.
// El comentario IPA de cada fila es solo referencia de desarrollo; no se
// muestra al usuario para no romper la pedagogía visual (Silent Way).
export const PHONEMES: readonly Phoneme[] = [
  // --- Vocales orales ---
  { id: 'vowel-a-oral',   color: '#E63946', audioFile: 'vowel-a-oral.wav',   ariaLabel: 'Ficha de sonido 1, pulsa para escuchar',  ttsText: 'lá'  }, // /a/
  { id: 'vowel-e-open',   color: '#F4A261', audioFile: 'vowel-e-open.wav',   ariaLabel: 'Ficha de sonido 2, pulsa para escuchar',  ttsText: 'pé'  }, // /ɛ/
  { id: 'vowel-e-closed', color: '#E9C46A', audioFile: 'vowel-e-closed.wav', ariaLabel: 'Ficha de sonido 3, pulsa para escuchar',  ttsText: 'mês' }, // /e/
  { id: 'vowel-i',        color: '#A7C957', audioFile: 'vowel-i.wav',        ariaLabel: 'Ficha de sonido 4, pulsa para escuchar',  ttsText: 'li'  }, // /i/
  { id: 'vowel-o-open',   color: '#2A9D8F', audioFile: 'vowel-o-open.wav',   ariaLabel: 'Ficha de sonido 5, pulsa para escuchar',  ttsText: 'só'  }, // /ɔ/
  { id: 'vowel-o-closed', color: '#4895EF', audioFile: 'vowel-o-closed.wav', ariaLabel: 'Ficha de sonido 6, pulsa para escuchar',  ttsText: 'avô' }, // /o/
  { id: 'vowel-u',        color: '#3A0CA3', audioFile: 'vowel-u.wav',        ariaLabel: 'Ficha de sonido 7, pulsa para escuchar',  ttsText: 'luz' }, // /u/
  // --- Vocales nasales ---
  { id: 'nasal-a',        color: '#C77DFF', audioFile: 'nasal-a.wav',        ariaLabel: 'Ficha de sonido 8, pulsa para escuchar',  ttsText: 'lã'  }, // /ɐ̃/
  { id: 'nasal-e',        color: '#FF7AA2', audioFile: 'nasal-e.wav',        ariaLabel: 'Ficha de sonido 9, pulsa para escuchar',  ttsText: 'cem' }, // /ẽ/
  { id: 'nasal-i',        color: '#8D99AE', audioFile: 'nasal-i.wav',        ariaLabel: 'Ficha de sonido 10, pulsa para escuchar', ttsText: 'sim' }, // /ĩ/
  { id: 'nasal-o',        color: '#B5838D', audioFile: 'nasal-o.wav',        ariaLabel: 'Ficha de sonido 11, pulsa para escuchar', ttsText: 'bom' }, // /õ/
  { id: 'nasal-u',        color: '#6D6875', audioFile: 'nasal-u.wav',        ariaLabel: 'Ficha de sonido 12, pulsa para escuchar', ttsText: 'um'  }, // /ũ/
];

// Resuelve la ruta web del audio de un fonema.
export function phonemeAudioSrc(phoneme: Phoneme): string {
  return `${PHONEME_AUDIO_BASE}/${phoneme.audioFile}`;
}
