// === CONTENT ANALYSIS TYPES ===

export interface ContentAnalysis {
  contentType: "vocabulary" | "concepts" | "mixed" | "other";
  confidence: number;
  summary: string;
  keyTopics: string[];
  vocabularyTerms: Array<{ term: string; definition?: string }>;
  estimatedCards: number;
  suggestedFocus: string[];
  reasoning: string;
}

export interface AnalyzeContentResponse {
  analysis: ContentAnalysis;
  metadata: {
    originalTextLength: number;
    wordCount: number;
    processingTime: number;
  };
}

// === FLASHCARD GENERATION TYPES ===

export interface GeneratedCard {
  id?: string;
  question: string;
  answer: string;
  isNew?: boolean;
}

export interface GenerateCardsResponse {
  cards: GeneratedCard[];
  metadata?: {
    generatedAt: string;
    totalCards: number;
    contentType?: string;
  };
}

export interface RegenerateCardResponse {
  card: {
    question: string;
    answer: string;
  };
}

// === IMPROVEMENT TYPES ===

export interface ImprovementRequest {
  cards: Array<{ id?: string; question: string; answer: string }>;
  improvement: string;
  customInstruction?: string;
  context?: string;
  contentType?: string;
  targetCardCount?: number;
}

export interface ImprovementResponse {
  cards: Array<{
    id?: string;
    question: string;
    answer: string;
    isNew?: boolean;
  }>;
}

// === ERROR TYPES ===

export interface ApiErrorResponse {
  error: string;
  details?: string;
}
