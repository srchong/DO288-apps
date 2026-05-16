// Tipos compartidos de la app.

// Una ficha de sonido del Color Chart (Vista 1).
export interface Phoneme {
  // Identificador estable y único (slug en inglés).
  id: string;
  // Color de la ficha en la cuadrícula (valor CSS).
  color: string;
  // Nombre del archivo de audio dentro de public/audio/phonemes/.
  audioFile: string;
  // Etiqueta accesible genérica: no revela el sonido objetivo.
  ariaLabel: string;
  // Texto que el script de TTS sintetiza para el audio placeholder.
  // La app no lo usa en tiempo de ejecución; solo lo consume
  // scripts/generate-audio.mjs.
  ttsText: string;
}
