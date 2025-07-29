export interface CreateFlashcard {
  question: string;
  answer: string;
}

export interface Flashcard extends CreateFlashcard {
  id: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  userId: string;
}

export interface StudyRound {
  // Round identification
  roundNumber: number;
  roundType: 'initial' | 'review' | 'missed';
  
  // Round timing
  startTime: Date;
  endTime?: Date;
  
  // Cards in this round
  cards: Flashcard[];
  totalCards: number;
  
  // Round-specific progress
  currentIndex: number;
  studiedCards: string[];     // Card IDs completed in this round
  correctAnswers: string[];   // Card IDs answered correctly
  incorrectAnswers: string[]; // Card IDs answered incorrectly
  skippedCards: string[];     // Card IDs skipped
  
  // Results for next round
  missedCards: Flashcard[];   // Cards that need review
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
  totalCardsStudied: number;     // Count of every card answer attempt
  totalCorrectAnswers: number;   // All correct answers across rounds
  totalIncorrectAnswers: number; // All incorrect answers across rounds
  totalSkippedCards: number;     // All skipped cards across rounds
  
  // Round tracking
  rounds: StudyRound[];
  currentRoundIndex: number;
  
  // Overall missed cards (across all rounds)
  allMissedCards: Flashcard[];   // Cards that still need work
}

export function parseCompletionToCards(text: string): CreateFlashcard[] {
  // Handle empty or whitespace-only input
  if (!text || text.trim() === "") {
    return [];
  }

  const trimmedText = text.trim();

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(trimmedText);

    // Check if it's an array
    if (Array.isArray(parsed)) {
      // Check if ALL items are valid flashcards
      const allValid =
        parsed.length > 0 &&
        parsed.every(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.question === "string" &&
            typeof item.answer === "string" &&
            item.question.trim() !== "" &&
            item.answer.trim() !== ""
        );

      // If ALL cards are valid, return them (preserving original structure)
      if (allValid) {
        return parsed.map((card) => ({
          ...card, // Preserve all properties including extra fields
        }));
      }
    }

    // If JSON parsing succeeded but didn't yield all valid flashcards, fall back to regex
    // Don't log an error here since this is expected behavior
  } catch (error) {
    // JSON parsing failed, fall back to regex parsing
    // Only log error if the text looks like it was intended to be JSON
    if (trimmedText.startsWith("[") || trimmedText.startsWith("{")) {
      console.error("Failed to parse flashcards:", error);
    }
  }

  // Fall back to Q: A: format parsing using regex
  const cards: CreateFlashcard[] = [];

  // Split text into potential Q: A: blocks and process each one
  // This prevents capturing across multiple Q: A: pairs
  const lines = trimmedText.split("\n");
  let currentQuestion = "";
  let currentAnswer = "";
  let inAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("Q:")) {
      // If we have a complete Q: A: pair, save it
      if (currentQuestion && currentAnswer) {
        cards.push({
          question: currentQuestion.trim(),
          answer: currentAnswer.trim(),
        });
      }

      // Start new question
      currentQuestion = line.substring(2).trim();
      currentAnswer = "";
      inAnswer = false;
    } else if (line.startsWith("A:")) {
      // Start collecting answer
      currentAnswer = line.substring(2).trim();
      inAnswer = true;
    } else if (inAnswer && line !== "") {
      // Continue collecting answer lines
      currentAnswer += "\n" + line;
    } else if (
      line === "" ||
      (!line.startsWith("Q:") && !line.startsWith("A:") && !inAnswer)
    ) {
      // Empty line or non-Q: A: content - stop collecting answer
      inAnswer = false;
    }
  }

  // Don't forget the last Q: A: pair
  if (currentQuestion && currentAnswer) {
    cards.push({
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
    });
  }

  return cards;
}
