import type {
  Flashcard,
  GeneratedCard,
  ReviewFlashcard,
} from "@/lib/types/flashcards";

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

// === CARD EDITING TYPES ===

export interface CardEditState {
  question: string;
  answer: string;
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

export type CardRefinementInstruction =
  | "make_harder"
  | "add_examples"
  | "add_context"
  | "fix_grammar"
  | "make_clearer"
  | "custom";

export interface CardRefinementOption {
  instruction: CardRefinementInstruction;
  label: string;
  description: string;
}

export interface CardRefinementRequest {
  originalCard: Flashcard;
  instruction: CardRefinementInstruction;
  context?: string;
  contentType?: string;
}

export interface CardRefinementResult {
  question: string;
  answer: string;
}

export interface CardRefinementState {
  regeneratingCards: Set<string>;
  error: string | null;
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

export interface BulkImprovementOption {
  type: BulkImprovementType;
  label: string;
  description: string;
  requiresTargetCount?: boolean;
}

export interface BulkImprovementRequest {
  selectedCards: Array<Flashcard>;
  improvementType: BulkImprovementType;
  customInstruction?: string;
  targetCardCount?: number;
  context?: string;
  contentType?: string;
}

export interface BulkImprovementResult {
  improvedCards: Array<GeneratedCard>;
  addedCards?: Array<GeneratedCard>;
}

export interface BulkImprovementState {
  isImproving: boolean;
  progress: number;
  currentOperation: string;
  error: string | null;
}

// === AI SUGGESTIONS TYPES ===

export interface AISuggestion {
  id: string;
  type: "difficulty" | "coverage" | "examples" | "clarity" | "count";
  title: string;
  description: string;
  instruction: BulkImprovementType;
  priority: "high" | "medium" | "low";
  applied: boolean;
  targetCardCount?: number;
  requiresSelection?: boolean;
}

export interface AISuggestionsState {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  appliedSuggestions: Set<string>;
  generatedSuggestionTypes: Set<string>; // Track what types we've suggested before
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
  generationState: GenerationState;
  handleFileUploaded: (url: string, fileName: string) => Promise<void>;
  handleTextInput: (text: string) => Promise<void>;
  handleStartOver: () => void;
  handleRetryGeneration: () => void;
  handleUploadCancelled: (fileUrl?: string) => void;
  handleCancelGeneration: () => void;
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

// === CARD REFINEMENT CONSTANTS ===

export const CARD_REFINEMENT_OPTIONS: CardRefinementOption[] = [
  {
    instruction: "make_harder",
    label: "Make Harder",
    description: "Increase difficulty with more complex questions",
  },
  {
    instruction: "add_examples",
    label: "Add Examples",
    description: "Include specific examples in the answer",
  },
  {
    instruction: "add_context",
    label: "Add Context",
    description: "Provide more background information",
  },
  {
    instruction: "fix_grammar",
    label: "Fix Grammar",
    description: "Improve grammar and clarity",
  },
  {
    instruction: "make_clearer",
    label: "Make Clearer",
    description: "Simplify and clarify the language",
  },
  {
    instruction: "custom",
    label: "Custom...",
    description: "Provide specific instructions",
  },
];

// === BULK IMPROVEMENT CONSTANTS ===

export const BULK_IMPROVEMENT_OPTIONS: BulkImprovementOption[] = [
  {
    type: "make_harder",
    label: "Make All Harder",
    description: "Increase difficulty across all selected cards",
  },
  {
    type: "make_easier",
    label: "Make Easier",
    description: "Simplify questions for better comprehension",
  },
  {
    type: "add_examples",
    label: "Add Examples",
    description: "Include examples in answers where helpful",
  },
  {
    type: "add_context",
    label: "Add Context",
    description: "Provide more background information",
  },
  {
    type: "diversify_questions",
    label: "Diversify Questions",
    description: "Create more varied question types",
  },
  {
    type: "improve_clarity",
    label: "Improve Clarity",
    description: "Make questions and answers clearer",
  },
  {
    type: "add_more_cards",
    label: "Add More Cards",
    description: "Generate additional cards for better coverage",
    requiresTargetCount: true,
  },
  {
    type: "fix_grammar",
    label: "Fix Grammar",
    description: "Correct grammar and improve language",
  },
  {
    type: "custom",
    label: "Custom Instruction",
    description: "Provide specific improvement instructions",
  },
];
