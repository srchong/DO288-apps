// Abstracción de evaluación fonética.
//
// La UI depende SOLO de esta interfaz, nunca de una implementación concreta.
// Así, sustituir el mock por una API real no obliga a tocar las vistas:
// basta con inyectar otra implementación de PhoneticEvaluator.

// Audio capturado más la palabra que el usuario debía pronunciar.
export interface EvaluationInput {
  audio: Blob;
  targetWord: string;
}

// Veredicto de la evaluación.
export interface EvaluationResult {
  // Si la pronunciación se considera correcta.
  success: boolean;
  // Puntuación 0-1 (opcional): la UI puede mostrarla o ignorarla.
  score?: number;
  // Mensaje breve para el usuario (opcional).
  message?: string;
}

export interface PhoneticEvaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
