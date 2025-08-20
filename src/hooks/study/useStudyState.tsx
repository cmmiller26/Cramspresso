import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { FlashcardSet, StudyRound, StudySession } from "@/lib/types/flashcards";
import { useStudyKeyboard } from "./useStudyKeyboard";

interface StudyActions {
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  onPrevious: () => void;
  onShuffleRound: () => Promise<void>;
  onResetToOriginal: () => Promise<void>;
  onStartReviewRound: (session: StudySession, round: StudyRound) => void;
  onRestartStudySession: () => void;
  onStartMissedCardsRound: () => void; // ✅ ADD: For all missed cards across session
  onToggleKeyboardHelp: () => void;
  onClearControlsError: () => void;
  loadSet: () => Promise<void>;
}

interface StudyState {
  // Data state
  setData: FlashcardSet | null;
  studySession: StudySession | null;
  currentRound: StudyRound | null;

  // Card interaction state
  showAnswer: boolean;
  feedback: "correct" | "incorrect" | "skipped" | null;
  isTransitioning: boolean;

  // UI state
  shuffled: boolean;
  showKeyboardHelp: boolean;

  // Loading and error state
  loading: boolean;
  error: string | null;
  controlsLoading: {
    shuffle: boolean;
    reset: boolean;
  };
  controlsError: string | null;

  // Actions
  actions: StudyActions;
}

export function useStudyState(setId: string): StudyState {
  const { isSignedIn } = useAuth();

  // Core study state
  const [setData, setSetData] = useState<FlashcardSet | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [currentRound, setCurrentRound] = useState<StudyRound | null>(null);

  // Card interaction state
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<
    "correct" | "incorrect" | "skipped" | null
  >(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state
  const [shuffled, setShuffled] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsLoading, setControlsLoading] = useState({
    shuffle: false,
    reset: false,
  });
  const [controlsError, setControlsError] = useState<string | null>(null);

  // Load set data
  const loadSet = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sets/${setId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Set not found");
        }
        throw new Error("Failed to load set");
      }

      const data = await res.json();
      setSetData(data);

      // Initialize study session with all required fields
      const initialRound: StudyRound = {
        roundNumber: 1,
        roundType: "initial",
        startTime: new Date(),
        cards: data.cards,
        currentIndex: 0,
        totalCards: data.cards.length,
        studiedCards: [],
        correctAnswers: [],
        incorrectAnswers: [],
        skippedCards: [],
        missedCards: [],
      };

      const session: StudySession = {
        setId: data.id,
        setName: data.name,
        startTime: new Date(),
        originalSetSize: data.cards.length,
        currentRoundIndex: 0,
        rounds: [initialRound],
        totalCardsStudied: 0,
        totalCorrectAnswers: 0,
        totalIncorrectAnswers: 0,
        totalSkippedCards: 0,
        allMissedCards: [],
      };

      setStudySession(session);
      setCurrentRound(initialRound);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [setId, isSignedIn]);

  // Action handlers
  const handleShowAnswer = useCallback(() => {
    if (!showAnswer && !isTransitioning) {
      setShowAnswer(true);
    }
  }, [showAnswer, isTransitioning]);

  const handleNext = useCallback(
    async (gotItRight?: boolean) => {
      if (!currentRound || !studySession) return;

      setIsTransitioning(true);

      const currentCard = currentRound.cards[currentRound.currentIndex];

      // Determine feedback
      let cardFeedback: "correct" | "incorrect" | "skipped";
      if (gotItRight === undefined) {
        cardFeedback = "skipped";
      } else {
        cardFeedback = gotItRight ? "correct" : "incorrect";
      }

      setFeedback(cardFeedback);

      // Brief pause to show feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update round statistics with correct types (using card IDs)
      const updatedStudiedCards = [
        ...currentRound.studiedCards,
        currentCard.id,
      ];
      const updatedCorrectAnswers = [...currentRound.correctAnswers];
      const updatedIncorrectAnswers = [...currentRound.incorrectAnswers];
      const updatedSkippedCards = [...currentRound.skippedCards];

      if (cardFeedback === "correct") {
        updatedCorrectAnswers.push(currentCard.id);
      } else if (cardFeedback === "incorrect") {
        updatedIncorrectAnswers.push(currentCard.id);
      } else {
        updatedSkippedCards.push(currentCard.id);
      }

      // Update session statistics
      const updatedSession: StudySession = {
        ...studySession,
        totalCardsStudied:
          cardFeedback === "correct" || cardFeedback === "incorrect"
            ? studySession.totalCardsStudied + 1
            : studySession.totalCardsStudied,
        totalCorrectAnswers:
          cardFeedback === "correct"
            ? studySession.totalCorrectAnswers + 1
            : studySession.totalCorrectAnswers,
        totalIncorrectAnswers:
          cardFeedback === "incorrect"
            ? studySession.totalIncorrectAnswers + 1
            : studySession.totalIncorrectAnswers,
        totalSkippedCards:
          cardFeedback === "skipped"
            ? studySession.totalSkippedCards + 1
            : studySession.totalSkippedCards,
        allMissedCards:
          cardFeedback === "incorrect" || cardFeedback === "skipped"
            ? [
                ...studySession.allMissedCards.filter(
                  (c) => c.id !== currentCard.id
                ),
                currentCard,
              ]
            : studySession.allMissedCards.filter(
                (c) => c.id !== currentCard.id
              ),
      };

      // Check if round is complete
      const nextIndex = currentRound.currentIndex + 1;
      const isRoundComplete = nextIndex >= currentRound.totalCards;

      if (isRoundComplete) {
        // Round complete
        console.log("Round complete!");

        const finalRound: StudyRound = {
          ...currentRound,
          currentIndex: nextIndex,
          studiedCards: updatedStudiedCards,
          correctAnswers: updatedCorrectAnswers,
          incorrectAnswers: updatedIncorrectAnswers,
          skippedCards: updatedSkippedCards,
          missedCards:
            cardFeedback === "incorrect" || cardFeedback === "skipped"
              ? [
                  ...currentRound.missedCards.filter(
                    (c) => c.id !== currentCard.id
                  ),
                  currentCard,
                ]
              : currentRound.missedCards.filter((c) => c.id !== currentCard.id),
          endTime: new Date(),
        };

        updatedSession.rounds = updatedSession.rounds.map((round) =>
          round.roundNumber === currentRound.roundNumber ? finalRound : round
        );

        setCurrentRound(finalRound);
        setStudySession(updatedSession);
      } else {
        // Continue to next card
        const updatedRound: StudyRound = {
          ...currentRound,
          currentIndex: nextIndex,
          studiedCards: updatedStudiedCards,
          correctAnswers: updatedCorrectAnswers,
          incorrectAnswers: updatedIncorrectAnswers,
          skippedCards: updatedSkippedCards,
          missedCards:
            cardFeedback === "incorrect" || cardFeedback === "skipped"
              ? [
                  ...currentRound.missedCards.filter(
                    (c) => c.id !== currentCard.id
                  ),
                  currentCard,
                ]
              : currentRound.missedCards.filter((c) => c.id !== currentCard.id),
        };

        updatedSession.rounds = updatedSession.rounds.map((round) =>
          round.roundNumber === currentRound.roundNumber ? updatedRound : round
        );

        setCurrentRound(updatedRound);
        setStudySession(updatedSession);
      }

      // Reset for next card
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
    },
    [currentRound, studySession]
  );

  const handlePrevious = useCallback(() => {
    if (!currentRound || currentRound.currentIndex <= 0 || !studySession)
      return;

    const newIndex = currentRound.currentIndex - 1;
    const cardToUndo = currentRound.cards[newIndex];

    // Undo the statistics for the card we're going back to
    const updatedStudiedCards = currentRound.studiedCards.filter(
      (id) => id !== cardToUndo.id
    );
    const updatedCorrectAnswers = currentRound.correctAnswers.filter(
      (id) => id !== cardToUndo.id
    );
    const updatedIncorrectAnswers = currentRound.incorrectAnswers.filter(
      (id) => id !== cardToUndo.id
    );
    const updatedSkippedCards = currentRound.skippedCards.filter(
      (id) => id !== cardToUndo.id
    );
    const updatedMissedCards = currentRound.missedCards.filter(
      (card) => card.id !== cardToUndo.id
    );

    // Update the round with the undone statistics
    const updatedRound: StudyRound = {
      ...currentRound,
      currentIndex: newIndex,
      studiedCards: updatedStudiedCards,
      correctAnswers: updatedCorrectAnswers,
      incorrectAnswers: updatedIncorrectAnswers,
      skippedCards: updatedSkippedCards,
      missedCards: updatedMissedCards,
    };

    // Calculate how much to subtract from session totals
    const wasCorrect = currentRound.correctAnswers.includes(cardToUndo.id);
    const wasIncorrect = currentRound.incorrectAnswers.includes(cardToUndo.id);
    const wasSkipped = currentRound.skippedCards.includes(cardToUndo.id);
    const wasActuallyStudied = wasCorrect || wasIncorrect;

    // Update session statistics (undo the card's contribution)
    const updatedSession: StudySession = {
      ...studySession,
      totalCardsStudied: wasActuallyStudied
        ? studySession.totalCardsStudied - 1
        : studySession.totalCardsStudied,
      totalCorrectAnswers: wasCorrect
        ? studySession.totalCorrectAnswers - 1
        : studySession.totalCorrectAnswers,
      totalIncorrectAnswers: wasIncorrect
        ? studySession.totalIncorrectAnswers - 1
        : studySession.totalIncorrectAnswers,
      totalSkippedCards: wasSkipped
        ? studySession.totalSkippedCards - 1
        : studySession.totalSkippedCards,
      allMissedCards:
        wasIncorrect || wasSkipped
          ? studySession.allMissedCards.filter(
              (card) => card.id !== cardToUndo.id
            )
          : studySession.allMissedCards,
      rounds: studySession.rounds.map((round) =>
        round.roundNumber === currentRound.roundNumber ? updatedRound : round
      ),
    };

    setCurrentRound(updatedRound);
    setStudySession(updatedSession);

    // Reset card interaction state
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
  }, [currentRound, studySession]);

  const handleShuffleRound = useCallback(async () => {
    if (!currentRound) return;

    setControlsLoading((prev) => ({ ...prev, shuffle: true }));
    setControlsError(null);

    try {
      // Create shuffled copy of current round's cards
      const shuffledCards = [...currentRound.cards].sort(
        () => Math.random() - 0.5
      );

      // Update the round with shuffled cards
      const updatedRound: StudyRound = {
        ...currentRound,
        cards: shuffledCards,
        currentIndex: 0,
        studiedCards: [],
        correctAnswers: [],
        incorrectAnswers: [],
        skippedCards: [],
        missedCards: [],
      };

      // Update the session
      setStudySession((prev) => {
        if (!prev) return prev;
        const updatedRounds = prev.rounds.map((round) =>
          round.roundNumber === currentRound.roundNumber ? updatedRound : round
        );
        return { ...prev, rounds: updatedRounds };
      });

      setCurrentRound(updatedRound);
      setShuffled(true);

      // Reset card state
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
    } catch (error) {
      console.error("Error shuffling cards:", error);
      setControlsError("Failed to shuffle cards. Please try again.");
    } finally {
      setControlsLoading((prev) => ({ ...prev, shuffle: false }));
    }
  }, [currentRound]);

  const handleResetToOriginal = useCallback(async () => {
    if (!studySession || !currentRound) return;

    setControlsLoading((prev) => ({ ...prev, reset: true }));
    setControlsError(null);

    try {
      // Get original card order from the set data
      const originalCards = setData?.cards || [];

      // Create reset round with original order
      const resetRound: StudyRound = {
        ...currentRound,
        cards: originalCards,
        currentIndex: 0,
        studiedCards: [],
        correctAnswers: [],
        incorrectAnswers: [],
        skippedCards: [],
        missedCards: [],
      };

      // Update the session
      setStudySession((prev) => {
        if (!prev) return prev;
        const updatedRounds = prev.rounds.map((round) =>
          round.roundNumber === currentRound.roundNumber ? resetRound : round
        );
        return { ...prev, rounds: updatedRounds };
      });

      setCurrentRound(resetRound);
      setShuffled(false);

      // Reset card state
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
    } catch (error) {
      console.error("Error resetting cards:", error);
      setControlsError("Failed to reset cards. Please try again.");
    } finally {
      setControlsLoading((prev) => ({ ...prev, reset: false }));
    }
  }, [studySession, currentRound, setData]);

  const handleStartReviewRound = useCallback(
    (updatedSession: StudySession, reviewRound: StudyRound) => {
      setStudySession(updatedSession);
      setCurrentRound(reviewRound);

      // Reset UI state for new round
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
      setShuffled(false);
    },
    []
  );

  const handleRestartStudySession = useCallback(() => {
    if (!setData) return;

    // Create a completely fresh study session
    const freshRound: StudyRound = {
      roundNumber: 1,
      roundType: "initial",
      startTime: new Date(),
      cards: setData.cards,
      currentIndex: 0,
      totalCards: setData.cards.length,
      studiedCards: [],
      correctAnswers: [],
      incorrectAnswers: [],
      skippedCards: [],
      missedCards: [],
    };

    const freshSession: StudySession = {
      setId: setData.id,
      setName: setData.name,
      startTime: new Date(),
      originalSetSize: setData.cards.length,
      currentRoundIndex: 0,
      rounds: [freshRound],
      totalCardsStudied: 0,
      totalCorrectAnswers: 0,
      totalIncorrectAnswers: 0,
      totalSkippedCards: 0,
      allMissedCards: [],
    };

    // Reset everything to fresh state
    setStudySession(freshSession);
    setCurrentRound(freshRound);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    setShuffled(false);
  }, [setData]);

  const handleToggleKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  const handleClearControlsError = useCallback(() => {
    setControlsError(null);
  }, []);

  // ✅ ADD: Handler for starting a missed cards round (all missed cards from session)
  const handleStartMissedCardsRound = useCallback(() => {
    if (
      !studySession ||
      !currentRound ||
      studySession.allMissedCards.length === 0
    )
      return;

    const missedCardsRound: StudyRound = {
      roundNumber: currentRound.roundNumber + 1,
      roundType: "missed",
      startTime: new Date(),
      cards: studySession.allMissedCards, // All missed cards from entire session
      currentIndex: 0,
      totalCards: studySession.allMissedCards.length,
      studiedCards: [],
      correctAnswers: [],
      incorrectAnswers: [],
      skippedCards: [],
      missedCards: [],
    };

    const updatedSession: StudySession = {
      ...studySession,
      currentRoundIndex: studySession.currentRoundIndex + 1,
      rounds: [...studySession.rounds, missedCardsRound],
    };

    setStudySession(updatedSession);
    setCurrentRound(missedCardsRound);

    // Reset UI state for new round
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    setShuffled(false);
  }, [studySession, currentRound]);

  // Load set on mount
  useEffect(() => {
    loadSet();
  }, [loadSet]);

  // ✅ IMPROVED: Use the dedicated keyboard hook
  useStudyKeyboard({
    showAnswer,
    currentIndex: currentRound?.currentIndex || 0,
    isLoading: controlsLoading.shuffle || controlsLoading.reset,
    onShowAnswer: handleShowAnswer,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onShuffle: handleShuffleRound,
    onToggleHelp: handleToggleKeyboardHelp,
  });

  // Create actions object
  const actions: StudyActions = {
    onShowAnswer: handleShowAnswer,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onShuffleRound: handleShuffleRound,
    onResetToOriginal: handleResetToOriginal,
    onStartReviewRound: handleStartReviewRound,
    onRestartStudySession: handleRestartStudySession,
    onStartMissedCardsRound: handleStartMissedCardsRound, // ✅ ADD
    onToggleKeyboardHelp: handleToggleKeyboardHelp,
    onClearControlsError: handleClearControlsError,
    loadSet,
  };

  return {
    // Data state
    setData,
    studySession,
    currentRound,

    // Card interaction state
    showAnswer,
    feedback,
    isTransitioning,

    // UI state
    shuffled,
    showKeyboardHelp,

    // Loading and error state
    loading,
    error,
    controlsLoading,
    controlsError,

    // Actions
    actions,
  };
}
