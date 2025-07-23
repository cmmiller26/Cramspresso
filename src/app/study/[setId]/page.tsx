"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { StudyInterface } from "@/components/study/StudyInterface";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorStates";
import { Flashcard, StudyRound, StudySession } from "@/lib/flashcards";

interface SetData {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export default function StudyPage() {
  const { setId } = useParams() as { setId: string };
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Core study state
  const [setData, setSetData] = useState<SetData | null>(null);
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

  // Controls loading states
  const [controlsLoading, setControlsLoading] = useState({
    shuffle: false,
    reset: false,
  });
  const [controlsError, setControlsError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

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
        studiedCards: [], // string[] of card IDs
        correctAnswers: [], // string[] of card IDs
        incorrectAnswers: [], // string[] of card IDs
        skippedCards: [], // string[] of card IDs
        missedCards: [], // Flashcard[] objects for review
      };

      const session: StudySession = {
        setId: data.id,
        setName: data.name,
        startTime: new Date(),
        originalSetSize: data.cards.length, // Required field
        currentRoundIndex: 0, // Required field
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

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  // Shuffle function with loading states
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
        currentIndex: 0, // Reset to start with shuffled deck
        studiedCards: [], // Clear card IDs since we're starting over
        correctAnswers: [], // Clear card IDs
        incorrectAnswers: [], // Clear card IDs
        skippedCards: [], // Clear card IDs
        missedCards: [], // Clear missed cards
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

      // No artificial delay - operation completes immediately
    } catch (error) {
      console.error("Error shuffling cards:", error);
      setControlsError("Failed to shuffle cards. Please try again.");
    } finally {
      setControlsLoading((prev) => ({ ...prev, shuffle: false }));
    }
  }, [currentRound]);

  // Reset function with loading states
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
        currentIndex: 0, // Reset to start
        studiedCards: [], // Clear card IDs since we're starting over
        correctAnswers: [], // Clear card IDs
        incorrectAnswers: [], // Clear card IDs
        skippedCards: [], // Clear card IDs
        missedCards: [], // Clear missed cards
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

      // No artificial delay - operation completes immediately
    } catch (error) {
      console.error("Error resetting cards:", error);
      setControlsError("Failed to reset cards. Please try again.");
    } finally {
      setControlsLoading((prev) => ({ ...prev, reset: false }));
    }
  }, [studySession, currentRound, setData]);

  // Clear controls error function
  const handleClearControlsError = useCallback(() => {
    setControlsError(null);
  }, []);

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

      // Update session statistics - FIXED: Only count as "studied" if actually answered
      const updatedSession: StudySession = {
        ...studySession,
        // Only increment totalCardsStudied for answered cards (correct/incorrect), not skipped
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
        // Round complete - handle round completion logic here
        console.log("Round complete!");

        // Update final round state with the last card's stats
        const finalRound: StudyRound = {
          ...currentRound,
          currentIndex: nextIndex, // This will be equal to totalCards
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
          endTime: new Date(), // Mark round as complete
        };

        // Update session with completed round
        updatedSession.rounds = updatedSession.rounds.map((round) =>
          round.roundNumber === currentRound.roundNumber ? finalRound : round
        );

        setCurrentRound(finalRound);
        setStudySession(updatedSession);

        // TODO: Add round completion UI or logic here
        // For now, just show completion in console
      } else {
        // Continue to next card with correct types
        const updatedRound: StudyRound = {
          ...currentRound,
          currentIndex: nextIndex,
          studiedCards: updatedStudiedCards,
          correctAnswers: updatedCorrectAnswers,
          incorrectAnswers: updatedIncorrectAnswers,
          skippedCards: updatedSkippedCards,
          // Update missedCards with actual Flashcard objects
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

      // Reset for next card (or round completion)
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

    // FIXED: Only count as "studied" if it was answered (correct/incorrect), not skipped
    const wasActuallyStudied = wasCorrect || wasIncorrect;

    // Update session statistics (undo the card's contribution)
    const updatedSession: StudySession = {
      ...studySession,
      // Only decrement totalCardsStudied if it was actually answered (not skipped)
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
      // Remove from allMissedCards if it was missed
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

  const handleToggleKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  // NEW: Handle starting a review round
  const handleStartReviewRound = useCallback(
    (updatedSession: StudySession, reviewRound: StudyRound) => {
      setStudySession(updatedSession);
      setCurrentRound(reviewRound);

      // Reset UI state for new round
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
      setShuffled(false); // Review rounds start unshuffled
    },
    []
  );

  // NEW: Handle restarting the entire study session
  const handleRestartStudySession = useCallback(() => {
    if (!setData) return;

    // Create a completely fresh study session
    const freshRound: StudyRound = {
      roundNumber: 1,
      roundType: "initial",
      startTime: new Date(),
      cards: setData.cards, // All original cards
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts during control loading
      if (controlsLoading.shuffle || controlsLoading.reset) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
        case "enter":
          event.preventDefault();
          if (!showAnswer) {
            handleShowAnswer();
          }
          break;
        case "y":
          event.preventDefault();
          if (showAnswer) {
            handleNext(true);
          }
          break;
        case "n":
          event.preventDefault();
          if (showAnswer) {
            handleNext(false);
          }
          break;
        case "arrowright":
          event.preventDefault();
          if (!showAnswer) {
            handleNext(); // Skip card
          }
          break;
        case "arrowleft":
          event.preventDefault();
          handlePrevious();
          break;
        case "?":
          event.preventDefault();
          handleToggleKeyboardHelp();
          break;
        case "h":
          event.preventDefault();
          handleToggleKeyboardHelp();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    showAnswer,
    controlsLoading,
    handleShowAnswer,
    handleNext,
    handlePrevious,
    handleToggleKeyboardHelp,
  ]);

  // Show loading state while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Show loading state while loading set
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading flashcard set..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState
          title="Failed to load study session"
          message={error}
          onRetry={loadSet}
          className="max-w-md"
        />
      </div>
    );
  }

  // Show error if no data
  if (!setData || !studySession || !currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState
          title="No study data available"
          message="Unable to start study session. Please try again."
          onRetry={loadSet}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <>
      <title>{`Studying: ${studySession.setName} - Cramspresso`}</title>
      <StudyInterface
        // Session and round data
        studySession={studySession}
        currentRound={currentRound}
        // Current card state
        showAnswer={showAnswer}
        feedback={feedback}
        isTransitioning={isTransitioning}
        // Actions
        onShowAnswer={handleShowAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        // Round management
        onShuffleRound={handleShuffleRound}
        onResetToOriginal={handleResetToOriginal}
        onStartReviewRound={handleStartReviewRound}
        onRestartStudySession={handleRestartStudySession} // NEW
        // UI state
        shuffled={shuffled}
        showKeyboardHelp={showKeyboardHelp}
        onToggleKeyboardHelp={handleToggleKeyboardHelp}
        // Loading and error handling
        controlsLoading={controlsLoading}
        controlsError={controlsError}
        onClearControlsError={handleClearControlsError}
      />
    </>
  );
}
