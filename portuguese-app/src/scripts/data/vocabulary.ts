// Banco de palabras y frases cortas en portugués para la Vista 2.

export interface VocabularyItem {
  // Identificador estable (slug en inglés).
  id: string;
  // Texto en portugués que el usuario debe pronunciar.
  text: string;
}

export const VOCABULARY: readonly VocabularyItem[] = [
  { id: 'ola', text: 'olá' },
  { id: 'bom-dia', text: 'bom dia' },
  { id: 'obrigado', text: 'obrigado' },
  { id: 'por-favor', text: 'por favor' },
  { id: 'agua', text: 'água' },
  { id: 'cafe', text: 'café' },
  { id: 'amigo', text: 'amigo' },
  { id: 'sim', text: 'sim' },
  { id: 'casa', text: 'casa' },
  { id: 'amor', text: 'amor' },
];
