import type {
  EvaluationInput,
  EvaluationResult,
  PhoneticEvaluator,
} from './PhoneticEvaluator';

// Parámetros del mock, configurables para que la simulación se sienta
// realista y sea testeable (p. ej. successRate 1 o 0 para forzar cada rama).
export interface MockEvaluatorConfig {
  // Latencia simulada mínima y máxima, en milisegundos.
  minLatencyMs: number;
  maxLatencyMs: number;
  // Probabilidad de éxito, entre 0 y 1.
  successRate: number;
}

export const DEFAULT_MOCK_CONFIG: MockEvaluatorConfig = {
  minLatencyMs: 600,
  maxLatencyMs: 1600,
  successRate: 0.6,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Implementación simulada de PhoneticEvaluator: latencia aleatoria dentro
// del rango configurado y veredicto aleatorio según successRate.
// Reemplazable por una API real sin tocar la UI.
export class MockPhoneticEvaluator implements PhoneticEvaluator {
  #config: MockEvaluatorConfig;

  constructor(config: Partial<MockEvaluatorConfig> = {}) {
    this.#config = { ...DEFAULT_MOCK_CONFIG, ...config };
  }

  // Ajusta la configuración en caliente (útil para probar cada rama).
  configure(config: Partial<MockEvaluatorConfig>): void {
    this.#config = { ...this.#config, ...config };
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    // Sin audio no hay nada que evaluar: respuesta inmediata y clara.
    if (input.audio.size === 0) {
      return {
        success: false,
        score: 0,
        message: 'No se detectó audio. Mantén pulsado el botón y habla.',
      };
    }

    const { minLatencyMs, maxLatencyMs, successRate } = this.#config;
    const latency = minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs);
    await delay(latency);

    const success = Math.random() < successRate;
    const score = success ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5;
    return {
      success,
      score,
      message: success ? '¡Muy bien!' : 'Casi. Inténtalo otra vez.',
    };
  }
}
