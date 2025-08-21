// === CORE FLASHCARD TYPES ===

export interface CreateFlashcard {
  question: string;
  answer: string;
}

export interface Flashcard extends CreateFlashcard {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedCard extends Flashcard {
  isNew?: boolean;
}

export interface ReviewFlashcard extends GeneratedCard {
  isEditing?: boolean;
}

// === FLASHCARD SET TYPES ===

export interface FlashcardSet {
  id: string;
  name: string;
  userId: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

// === STUDY SESSION TYPES ===

export interface StudyRound {
  // Round identification
  roundNumber: number;
  roundType: "initial" | "review" | "missed";

  // Round timing
  startTime: Date;
  endTime?: Date;

  // Cards in this round
  cards: Flashcard[];
  totalCards: number;

  // Round-specific progress
  currentIndex: number;
  studiedCards: string[]; // Card IDs completed in this round
  correctAnswers: string[]; // Card IDs answered correctly
  incorrectAnswers: string[]; // Card IDs answered incorrectly
  skippedCards: string[]; // Card IDs skipped

  // Results for next round
  missedCards: Flashcard[]; // Cards that need review
}

export interface StudySession {
  // Overall session tracking
  startTime: Date;
  endTime?: Date;

  // Set information
  originalSetSize: number;
  setId: string;
  setName: string;

  // Cumulative stats across ALL rounds
  totalCardsStudied: number; // Count of every card answer attempt
  totalCorrectAnswers: number; // All correct answers across rounds
  totalIncorrectAnswers: number; // All incorrect answers across rounds
  totalSkippedCards: number; // All skipped cards across rounds

  // Round tracking
  rounds: StudyRound[];
  currentRoundIndex: number;

  // Overall missed cards (across all rounds)
  allMissedCards: Flashcard[]; // Cards that still need work
}

// === DASHBOARD TYPES ===

export interface DashboardStats {
  totalSets: number;
  totalCards: number;
  studySessionsThisWeek: number;
  averageScore: number;
  averageCardsPerSet: number;
}

export interface SetGridItem {
  id: string;
  name: string;
  cardCount: number;
  lastStudied?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

// === SET MANAGEMENT STATE TYPES ===

export interface SetEditingState {
  isEditing: boolean;
  editingCardId?: string;
  hasChanges: boolean;
  unsavedChanges: Record<string, Partial<Flashcard>>;
}

export interface CardUpdatePayload {
  question?: string;
  answer?: string;
}

export interface CardEditorState {
  editingCardId: string | null;
  editingQuestion: string;
  editingAnswer: string;
  updatingCard: boolean;
  deletingCardId: string | null;
}

export interface NewCardState {
  newQuestion: string;
  newAnswer: string;
  addingCard: boolean;
}

export interface SetOperationState {
  saving: boolean;
  deleting: boolean;
  loading: boolean;
  error?: string;
}
