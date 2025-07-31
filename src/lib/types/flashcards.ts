// === CORE FLASHCARD TYPES ===

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateFlashcard {
  question: string;
  answer: string;
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
