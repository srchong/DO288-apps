// Captura de micrófono para la Vista 2 (push-to-talk).
//
// Usa getUserMedia para obtener el MediaStream y MediaRecorder para grabar
// a un Blob que luego se envía al evaluador fonético. La visualización en
// vivo del nivel (AnalyserNode) NO va aquí: MediaRecorder no expone datos de
// nivel, por eso quedaría en un módulo aparte si se necesita.

// Resultado de una grabación.
export interface Recording {
  blob: Blob;
  mimeType: string;
}

// Categorías de fallo del micrófono, para que la UI muestre el mensaje y la
// acción de recuperación adecuados.
export type MicErrorKind =
  | 'insecure-context' // la página no es HTTPS ni localhost
  | 'unsupported' // el navegador no soporta getUserMedia/MediaRecorder
  | 'permission-denied' // el usuario rechazó el permiso
  | 'no-device' // no hay ningún micrófono disponible
  | 'unknown';

// Error de micrófono con categoría, distinguible con `err instanceof MicError`.
export class MicError extends Error {
  readonly kind: MicErrorKind;

  constructor(kind: MicErrorKind, message: string) {
    super(message);
    this.name = 'MicError';
    this.kind = kind;
  }
}

// mimeTypes a probar en orden: iOS Safari solo soporta audio/mp4; el resto
// de navegadores prefieren audio/webm.
const MIME_CANDIDATES = ['audio/webm', 'audio/mp4', 'audio/ogg'] as const;

function isMicSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

// Elige un mimeType soportado, o undefined para dejar que el navegador
// use su valor por defecto.
function pickMimeType(): string | undefined {
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

// Traduce el error de getUserMedia a una categoría MicError.
function toMicError(err: unknown): MicError {
  const name = err instanceof Error ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return new MicError('permission-denied', 'Permiso de micrófono denegado.');
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return new MicError('no-device', 'No se encontró ningún micrófono.');
    default:
      return new MicError('unknown', 'No se pudo acceder al micrófono.');
  }
}

class MicRecorder {
  #stream: MediaStream | null = null;
  #recorder: MediaRecorder | null = null;
  #chunks: Blob[] = [];

  // ¿Hay una grabación en curso?
  get isRecording(): boolean {
    return this.#recorder?.state === 'recording';
  }

  // Obtiene el MediaStream del micrófono. La primera vez muestra el diálogo
  // de permiso; después reutiliza el stream para que el push-to-talk capture
  // sin latencia. Lanza MicError con la categoría correspondiente si falla.
  async #ensureStream(): Promise<MediaStream> {
    if (this.#stream) return this.#stream;
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new MicError(
        'insecure-context',
        'La captura de micrófono requiere una conexión segura (HTTPS).',
      );
    }
    if (!isMicSupported()) {
      throw new MicError(
        'unsupported',
        'Este navegador no soporta la captura de micrófono.',
      );
    }
    try {
      this.#stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return this.#stream;
    } catch (err) {
      throw toMicError(err);
    }
  }

  // Inicia la grabación. Si aún no hay permiso, lo solicita. Es idempotente:
  // si ya se está grabando, no hace nada.
  async start(): Promise<void> {
    if (this.isRecording) return;
    const stream = await this.#ensureStream();
    const mimeType = pickMimeType();
    this.#chunks = [];
    this.#recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.#recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.#chunks.push(event.data);
    };
    this.#recorder.start();
  }

  // Detiene la grabación en curso y devuelve el audio capturado.
  stop(): Promise<Recording> {
    return new Promise((resolve, reject) => {
      const recorder = this.#recorder;
      if (!recorder || recorder.state === 'inactive') {
        reject(new MicError('unknown', 'No hay ninguna grabación en curso.'));
        return;
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(this.#chunks, { type: mimeType });
        this.#chunks = [];
        this.#recorder = null;
        resolve({ blob, mimeType });
      };
      recorder.stop();
    });
  }

  // Libera el micrófono (detiene las pistas y apaga el indicador del sistema).
  // Conviene llamarlo al salir de la Vista 2.
  release(): void {
    if (this.#recorder && this.#recorder.state !== 'inactive') {
      this.#recorder.stop();
    }
    this.#recorder = null;
    this.#chunks = [];
    this.#stream?.getTracks().forEach((track) => track.stop());
    this.#stream = null;
  }
}

// Singleton: la app comparte una única instancia de captura.
export const micRecorder = new MicRecorder();
