// Medidor de nivel del micrófono para la Vista 2.
//
// Deriva un AnalyserNode del MediaStream del micrófono y reporta el nivel
// (0-1) en cada frame. Es independiente de MicRecorder: MediaRecorder graba
// a un Blob pero no expone el nivel en vivo; eso es trabajo de Web Audio.

type LevelCallback = (level: number) => void;

// Resuelve el constructor de AudioContext con fallback para Safari antiguo.
function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

class LevelMeter {
  #context: AudioContext | null = null;
  #rafId: number | null = null;

  // Empieza a medir el nivel del stream dado. `onLevel` se invoca por frame
  // con un valor 0-1. Detiene cualquier medición anterior.
  start(stream: MediaStream, onLevel: LevelCallback): void {
    this.stop();
    const Ctx = resolveAudioContext();
    if (!Ctx) return;

    const context = new Ctx();
    this.#context = context;
    void context.resume();

    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = (): void => {
      analyser.getByteTimeDomainData(data);
      // Nivel RMS sobre la forma de onda (muestras centradas en 128).
      let sum = 0;
      for (const sample of data) {
        const value = (sample - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / data.length);
      // Factor de escala para que una voz normal llene bien el rango 0-1.
      onLevel(Math.min(1, rms * 2.4));
      this.#rafId = requestAnimationFrame(tick);
    };
    this.#rafId = requestAnimationFrame(tick);
  }

  // Detiene la medición y libera los recursos de audio.
  stop(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    if (this.#context && this.#context.state !== 'closed') {
      void this.#context.close();
    }
    this.#context = null;
  }
}

// Singleton: la app comparte un único medidor de nivel.
export const levelMeter = new LevelMeter();
