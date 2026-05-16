// Motor de audio: gestiona un único AudioContext, precarga clips a
// AudioBuffer y los reproduce sin lag perceptible. Lo usan la Vista 1
// (fonemas) y la Vista 2 (SFX de feedback).

// Un clip de audio a precargar: identificador estable + ruta web.
export interface AudioClip {
  id: string;
  src: string;
}

// Resuelve el constructor de AudioContext con fallback para Safari antiguo.
function resolveAudioContext(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

class AudioEngine {
  #context: AudioContext | null = null;
  #buffers = new Map<string, AudioBuffer>();
  #currentSource: AudioBufferSourceNode | null = null;

  // Crea el AudioContext de forma perezosa. Nace *suspended* por la política
  // de autoplay del navegador; se reanuda en unlock().
  #getContext(): AudioContext | null {
    if (this.#context) return this.#context;
    const Ctx = resolveAudioContext();
    if (!Ctx) return null;
    this.#context = new Ctx();
    return this.#context;
  }

  // Reanuda el AudioContext. Debe invocarse dentro de un gesto del usuario
  // (p. ej. el primer clic o toque). Es idempotente.
  async unlock(): Promise<void> {
    const ctx = this.#getContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  // Precarga y decodifica una lista de clips. Tolerante a fallos: un clip
  // que no se pueda descargar o decodificar se omite sin abortar el resto,
  // de modo que un audio ausente no rompe la app.
  async preload(clips: readonly AudioClip[]): Promise<void> {
    const ctx = this.#getContext();
    if (!ctx) return;
    await Promise.allSettled(
      clips.map(async (clip) => {
        try {
          const response = await fetch(clip.src);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(data);
          this.#buffers.set(clip.id, buffer);
        } catch (err) {
          console.warn(`No se pudo precargar el audio «${clip.id}» (${clip.src}):`, err);
        }
      }),
    );
  }

  // ¿El clip está precargado y listo para reproducir?
  has(id: string): boolean {
    return this.#buffers.has(id);
  }

  // Reproduce un clip precargado y devuelve una promesa que se resuelve
  // cuando el clip termina (o se interrumpe). Detiene el clip anterior para
  // evitar solapamientos. Si el clip no existe, resuelve de inmediato.
  play(id: string): Promise<void> {
    const ctx = this.#context;
    const buffer = this.#buffers.get(id);
    if (!ctx || !buffer) return Promise.resolve();
    // Red de seguridad: play() siempre se invoca desde un gesto del usuario,
    // así que es seguro reanudar el contexto si aún sigue suspendido.
    if (ctx.state === 'suspended') void ctx.resume();

    this.#stopCurrent();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const ended = new Promise<void>((resolve) => {
      source.onended = () => {
        if (this.#currentSource === source) this.#currentSource = null;
        resolve();
      };
    });
    source.start();
    this.#currentSource = source;
    return ended;
  }

  // Detiene el clip en curso, si lo hay.
  #stopCurrent(): void {
    if (!this.#currentSource) return;
    try {
      this.#currentSource.stop();
    } catch {
      // El nodo ya había terminado: ignorar.
    }
    this.#currentSource = null;
  }
}

// Singleton: toda la app comparte un único motor de audio.
export const audioEngine = new AudioEngine();
