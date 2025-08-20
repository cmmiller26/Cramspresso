import type { GeneratedCard } from "@/lib/types/flashcards";

// === CREATE FLOW STATE TYPES ===

export type FlowStep = "upload" | "analyzing" | "generating" | "preview";

export interface CreateFlowState {
  step: FlowStep;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  source: "file" | "text";
  isExtracting: boolean;
  error?: string;
  successMessage?: string;
  cancelledFileUrls?: Set<string>;
  lastAnalysis?: ContentAnalysis;
}

// === ANALYSIS STATE TYPES ===

export interface AnalyzeContentRequest {
  text: string;
}

export interface ContentAnalysis {
  contentType: "vocabulary" | "concepts" | "mixed" | "other";
  confidence: number;
  summary: string;
  keyTopics: string[];
  vocabularyTerms: Array<{ term: string; definition?: string }>;
  contentGuidance: {
    approach: "one-per-term" | "concept-coverage" | "balanced";
    rationale: string;
    expectedRange: string;
  };
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

export interface ContentAnalysisState {
  isAnalyzing: boolean;
  analysis: ContentAnalysis | null;
  error: string | null;
}

// === GENERATION STATE TYPES ===

export interface GenerationRequest {
  text: string;
  analysis?: ContentAnalysis;
  focusAreas?: string[]; // User can override suggested focus
  customInstructions?: string; // Optional additional instructions
}

export interface GenerationStage {
  id: string;
  label: string;
  description: string;
  duration: number; // milliseconds
  endProgress: number; // 0-100
}

export interface GenerationState {
  isGenerating: boolean;
  currentStage: number;
  progress: number;
  error?: string;
  canCancel: boolean;
  currentStageDescription: string;
  generatedCards: GeneratedCard[];
  contentType?: string;
  contentHint?: string; // e.g., "15 vocabulary terms" or "3 key concepts"
}

export interface GenerationResponse {
  cards: GeneratedCard[];
  metadata?: {
    generatedAt: string;
    totalCards: number;
    contentType?: string;
  };
}

// === PREVIEW TYPES ===

export interface PreviewState {
  cards: GeneratedCard[];
  setName: string;
  isSaving: boolean;
  saveProgress: number;
  error: string | null;
}

// === SAVE OPERATION TYPES ===

export interface SaveSetRequest {
  name: string;
  cards: Array<{
    question: string;
    answer: string;
  }>;
  analysis?: ContentAnalysis;
}

export interface SaveSetResult {
  setId: string;
  redirect: string;
}

export interface SaveProgress {
  current: number;
  total: number;
  stage: string;
  percentage: number;
}

// === VALIDATION TYPES ===

export interface ValidationError {
  field: "question" | "answer" | "setName";
  message: string;
}

export interface CardValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface SetValidation {
  isValid: boolean;
  errors: ValidationError[];
  cardCount: number;
  minCards: number;
  maxCards: number;
}

// === OPERATION STATE TYPES ===

export interface OperationState {
  isRunning: boolean;
  progress: number;
  stage: string;
  error?: string;
  canCancel: boolean;
}

export interface CardOperationState extends OperationState {
  affectedCardIds: string[];
}

// === FILE UPLOAD TYPES ===

export interface FileUploadState {
  isUploading: boolean;
  uploadProgress: number;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}

export interface TextExtractionState {
  isExtracting: boolean;
  extractedText: string;
  error?: string;
}


// === HOOK RETURN TYPES ===

export interface UseCreateFlowReturn {
  state: CreateFlowState;
  generationState: GenerationState;
  previewState: PreviewState;
  handleFileUploaded: (url: string, fileName: string) => Promise<void>;
  handleTextInput: (text: string) => Promise<void>;
  handleStartOver: () => void;
  handleRetryGeneration: () => void;
  handleUploadCancelled: (fileUrl?: string) => void;
  handleCancelGeneration: () => void;
  handleSaveSet: (setName: string) => Promise<void>;
  clearError: () => void;
}

// === CREATE FLOW CONSTANTS ===

export const CREATE_FLOW_CONSTANTS = {
  MIN_CARDS_PER_SET: 1,
  MAX_CARDS_PER_SET: 100,
  MIN_QUESTION_LENGTH: 5,
  MIN_ANSWER_LENGTH: 3,
  MAX_QUESTION_LENGTH: 500,
  MAX_ANSWER_LENGTH: 1000,
  MIN_TEXT_LENGTH: 50,
  MAX_TEXT_LENGTH: 50000,
  AUTOSAVE_DELAY: 2000, // milliseconds
  RETRY_ATTEMPTS: 3,
  TIMEOUT_DURATION: 30000, // milliseconds
} as const;

export const VALIDATION_MESSAGES = {
  QUESTION_TOO_SHORT: "Question must be at least 5 characters long",
  QUESTION_TOO_LONG: "Question cannot exceed 500 characters",
  ANSWER_TOO_SHORT: "Answer must be at least 3 characters long",
  ANSWER_TOO_LONG: "Answer cannot exceed 1000 characters",
  SET_NAME_REQUIRED: "Set name is required",
  SET_NAME_TOO_LONG: "Set name cannot exceed 100 characters",
  INSUFFICIENT_CARDS: "At least 1 card is required",
  TOO_MANY_CARDS: "Cannot exceed 100 cards per set",
  TEXT_TOO_SHORT: "Text must be at least 50 characters long",
  TEXT_TOO_LONG: "Text cannot exceed 50,000 characters",
} as const;

// === GENERATION CONSTANTS ===

export const GENERATION_STAGES: GenerationStage[] = [
  {
    id: "analyzing",
    label: "Analyzing Content",
    description: "AI is understanding your content structure and key concepts",
    duration: 2500,
    endProgress: 25,
  },
  {
    id: "planning",
    label: "Planning Strategy",
    description: "Determining optimal question types and difficulty levels",
    duration: 1500,
    endProgress: 45,
  },
  {
    id: "generating",
    label: "Creating Flashcards",
    description: "Creating flashcards for key concepts and vocabulary",
    duration: 4000,
    endProgress: 90,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Preparing your flashcards for review",
    duration: 1000,
    endProgress: 100,
  },
];

