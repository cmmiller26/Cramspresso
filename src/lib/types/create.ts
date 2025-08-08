import type { ContentAnalysis } from "@/lib/types/api";
import type { Flashcard as BaseFlashcard } from "@/lib/types/flashcards";

// === CREATE FLOW STATE TYPES ===

export type FlowStep = "upload" | "analyzing" | "generating" | "complete";

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

// === CARD EDITING TYPES ===

export interface CardEditState {
  question: string;
  answer: string;
}

export interface ReviewFlashcard extends BaseFlashcard {
  isEditing?: boolean;
  isNew?: boolean;
}

export interface EditStatesMap {
  [cardId: string]: CardEditState;
}

// === SELECTION TYPES ===

export interface SelectionState {
  selectedCards: Set<string>;
  isSelectingAll: boolean;
  selectionMode: "individual" | "bulk";
}

// === REFINEMENT TYPES ===

export interface CardRefinementRequest {
  cardId: string;
  originalCard: {
    question: string;
    answer: string;
  };
  instruction: string;
  context?: string;
  contentType?: string;
}

export interface CardRefinementResult {
  question: string;
  answer: string;
}

// === BULK IMPROVEMENT TYPES ===

export type BulkImprovementType =
  | "make_harder"
  | "make_easier"
  | "add_examples"
  | "add_context"
  | "diversify_questions"
  | "improve_clarity"
  | "add_more_cards"
  | "fix_grammar"
  | "custom";

export interface BulkImprovementRequest {
  selectedCards: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  improvementType: BulkImprovementType;
  customInstruction?: string;
  targetCardCount?: number;
  context?: string;
  contentType?: string;
}

export interface BulkImprovementResult {
  improvedCards: Array<{
    id?: string;
    question: string;
    answer: string;
    isNew?: boolean;
  }>;
  addedCards?: Array<{
    id: string;
    question: string;
    answer: string;
    isNew: true;
  }>;
}

// === AI SUGGESTIONS TYPES ===

export interface AISuggestion {
  id: string;
  type: "improvement" | "addition" | "restructure";
  title: string;
  description: string;
  instruction: string;
  impact: "low" | "medium" | "high";
  requiresSelection: boolean;
  targetCardCount?: number;
  isApplied?: boolean;
}

export interface AISuggestionsState {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  error: string | null;
  lastGeneratedAt?: Date;
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

// === REVIEW PAGE STATE ===

export interface ReviewPageState {
  cards: ReviewFlashcard[];
  loading: boolean;
  error: string | null;
  analysis: ContentAnalysis | null;
  sourceText: string;
  editStates: EditStatesMap;
  selectedCards: Set<string>;
  isSaving: boolean;
  saveProgress: number;
}

// === HOOK RETURN TYPES ===

export interface UseCreateFlowReturn {
  state: CreateFlowState;
  handleFileUploaded: (url: string, fileName: string) => Promise<void>;
  handleTextInput: (text: string) => Promise<void>;
  handleStartOver: () => void;
  handleRetryGeneration: () => void;
  clearError: () => void;
}

export interface UseCardManagerReturn {
  cards: ReviewFlashcard[];
  editStates: EditStatesMap;
  startEditing: (cardId: string) => void;
  cancelEditing: (cardId: string) => void;
  saveCard: (cardId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addNewCard: () => void;
  updateEditState: (
    cardId: string,
    field: "question" | "answer",
    value: string
  ) => void;
  validateCard: (cardId: string) => CardValidation;
  isCardEditing: (cardId: string) => boolean;
}

export interface UseCardSelectionReturn {
  selectedCards: Set<string>;
  toggleCardSelection: (cardId: string) => void;
  selectAllCards: () => void;
  clearSelection: () => void;
  isCardSelected: (cardId: string) => boolean;
  selectedCount: number;
  bulkDeleteCards: () => Promise<void>;
}

// === CONSTANTS ===

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
