"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { redirect, useParams } from "next/navigation";
import { StudyInterface } from "@/components/study/StudyInterface";
import { StudyComplete } from "@/components/study/StudyComplete";
import {
  StudyErrorState,
  StudyNoCardsState,
} from "@/components/study/StudyErrorStates";
import { useStudyKeyboard } from "@/components/study/useStudyKeyboard";
import type { Flashcard, FlashcardSet, StudySession, StudyRound } from "@/lib/flashcards";

export default function StudyPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const setId = params.setId as string;

  // Core state
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Round-based study state
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [currentRound, setCurrentRound] = useState<StudyRound | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "skipped" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state (keep existing)
  const [shuffled, setShuffled] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Loading states for controls
  const [controlsLoading, setControlsLoading] = useState({
    shuffle: false,
    reset: false,
  });
  const [controlsError, setControlsError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect("/sign-in");
    }
  }, [isLoaded, isSignedIn]);

  // Fetch flashcard set
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchSet = async () => {
      try {
        const response = await fetch(`/api/sets/${setId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch flashcard set");
        }
        const data = await response.json();
        setSet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSet();
  }, [setId, isSignedIn]);

  // Initialize study session when set loads
  useEffect(() => {
    if (!set || studySession) return;
    
    const initialRound: StudyRound = {
      roundNumber: 1,
      roundType: 'initial',
      startTime: new Date(),
      cards: [...set.cards],
      totalCards: set.cards.length,
      currentIndex: 0,
      studiedCards: [],
      correctAnswers: [],
      incorrectAnswers: [],
      skippedCards: [],
      missedCards: [],
    };
    
    const newStudySession: StudySession = {
      startTime: new Date(),
      originalSetSize: set.cards.length,
      setId: set.id,
      setName: set.name,
      totalCardsStudied: 0,
      totalCorrectAnswers: 0,
      totalIncorrectAnswers: 0,
      totalSkippedCards: 0,
      rounds: [initialRound],
      currentRoundIndex: 0,
      allMissedCards: [],
    };
    
    setStudySession(newStudySession);
    setCurrentRound(initialRound);
  }, [set, studySession]);

  // Clear feedback when card changes
  useEffect(() => {
    setFeedback(null);
    setIsTransitioning(false);
  }, [currentRound?.currentIndex]);

  // Helper function to set loading state for specific operation
  const setOperationLoading = useCallback(
    (operation: keyof typeof controlsLoading, isLoading: boolean) => {
      setControlsLoading((prev) => ({ ...prev, [operation]: isLoading }));
    },
    []
  );

  // Helper function to handle operation errors
  const handleOperationError = useCallback((error: string) => {
    setControlsError(error);
    // Auto-clear error after 5 seconds
    setTimeout(() => setControlsError(null), 5000);
  }, []);

  // Shuffle current round cards
  const handleShuffleRound = useCallback(async () => {
    if (!currentRound || !studySession || controlsLoading.shuffle) return;

    setOperationLoading("shuffle", true);
    setControlsError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 🔧 FIX: Only shuffle remaining unstudied cards
      const studiedCards = currentRound.cards.slice(0, currentRound.currentIndex);
      const remainingCards = currentRound.cards.slice(currentRound.currentIndex);
      const shuffledRemainingCards = [...remainingCards].sort(() => Math.random() - 0.5);
      
      // Combine studied cards (in order) with shuffled remaining cards
      const reorderedCards = [...studiedCards, ...shuffledRemainingCards];
      
      // 🔧 FIX: Preserve round start time and progress
      const updatedRound: StudyRound = {
        ...currentRound,
        cards: reorderedCards,
        // Keep currentIndex the same - we're at the same position in our progress
        // DON'T reset: startTime, studiedCards, correctAnswers, etc.
        // Only changed: card order for remaining cards
      };

      setCurrentRound(updatedRound);
      setShuffled(true);
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
      
      // Update the round in the session
      if (studySession) {
        const updatedSession = { ...studySession };
        updatedSession.rounds[studySession.currentRoundIndex] = updatedRound;
        setStudySession(updatedSession);
      }
    } catch (error) {
      handleOperationError("Failed to shuffle cards. Please try again.");
      console.error("Shuffle error:", error);
    } finally {
      setOperationLoading("shuffle", false);
    }
  }, [
    currentRound,
    studySession,
    controlsLoading.shuffle,
    setOperationLoading,
    handleOperationError,
  ]);

  // Reset to original order with loading state (only available when shuffled)
  const handleResetToOriginal = useCallback(async () => {
    if (!set || !currentRound || controlsLoading.reset) return;

    setOperationLoading("reset", true);
    setControlsError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 🔧 FIX: Only reset remaining unstudied cards to original order
      const studiedCards = currentRound.cards.slice(0, currentRound.currentIndex);
      
      // Get original order for remaining cards based on round type
      let originalFullCards: Flashcard[];
      if (currentRound.roundType === 'initial') {
        originalFullCards = [...set.cards];
      } else {
        // For review rounds, we need to find the original order from when the round started
        // Since we can't easily reconstruct this, we'll use the current cards as the "original"
        // This is a reasonable fallback for review rounds
        originalFullCards = [...currentRound.cards];
      }

      // Find remaining cards in their original order
      const studiedCardIds = new Set(studiedCards.map(card => card.id));
      const remainingCardsInOriginalOrder = originalFullCards.filter(
        card => !studiedCardIds.has(card.id)
      );

      // Combine studied cards (in current order) with remaining cards in original order
      const reorderedCards = [...studiedCards, ...remainingCardsInOriginalOrder];

      // 🔧 FIX: Preserve round start time and progress
      const updatedRound: StudyRound = {
        ...currentRound,
        cards: reorderedCards,
        // Keep currentIndex the same - we're at the same position in our progress
        // DON'T reset: startTime, studiedCards, correctAnswers, etc.
        // Only changed: card order for remaining cards back to original
      };

      setCurrentRound(updatedRound);
      setShuffled(false);
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
      
      // Update the round in the session
      if (studySession) {
        const updatedSession = { ...studySession };
        updatedSession.rounds[studySession.currentRoundIndex] = updatedRound;
        setStudySession(updatedSession);
      }
    } catch (error) {
      handleOperationError("Failed to reset to original order. Please try again.");
      console.error("Reset to original error:", error);
    } finally {
      setOperationLoading("reset", false);
    }
  }, [
    set,
    currentRound,
    controlsLoading.reset,
    setOperationLoading,
    handleOperationError,
  ]);


  // Start a new round with specific cards
  const startNewRound = useCallback((cards: Flashcard[], roundType: 'review' | 'missed' | 'initial') => {
    if (!studySession) return;
    
    const newRoundNumber = studySession.rounds.length + 1;
    const newRound: StudyRound = {
      roundNumber: newRoundNumber,
      roundType,
      startTime: new Date(),
      cards: [...cards],
      totalCards: cards.length,
      currentIndex: 0,
      studiedCards: [],
      correctAnswers: [],
      incorrectAnswers: [],
      skippedCards: [],
      missedCards: [],
    };
    
    const updatedSession = {
      ...studySession,
      rounds: [...studySession.rounds, newRound],
      currentRoundIndex: newRoundNumber - 1,
    };
    
    setStudySession(updatedSession);
    setCurrentRound(newRound);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
  }, [studySession]);

  // Start review round with missed cards from current round
  const startReviewRound = useCallback(() => {
    if (!currentRound || currentRound.missedCards.length === 0) return;
    startNewRound(currentRound.missedCards, 'review');
  }, [currentRound, startNewRound]);

  // Start new round with entire original set
  const studyEntireSet = useCallback(() => {
    if (!set) return;
    startNewRound(set.cards, 'initial');
  }, [set, startNewRound]);

  // Handle showing answer
  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  // Handle previous card - clears any previous answer for that card
  const handlePrevious = useCallback(() => {
    if (!currentRound || !studySession || currentRound.currentIndex <= 0) return;
    
    const prevCardId = currentRound.cards[currentRound.currentIndex - 1]?.id;
    if (!prevCardId) return;

    // Update current round - remove previous card answers
    const updatedRound = { ...currentRound };
    updatedRound.studiedCards = updatedRound.studiedCards.filter((id) => id !== prevCardId);
    updatedRound.correctAnswers = updatedRound.correctAnswers.filter((id) => id !== prevCardId);
    updatedRound.incorrectAnswers = updatedRound.incorrectAnswers.filter((id) => id !== prevCardId);
    updatedRound.skippedCards = updatedRound.skippedCards.filter((id) => id !== prevCardId);
    updatedRound.missedCards = updatedRound.missedCards.filter((card) => card.id !== prevCardId);
    updatedRound.currentIndex = updatedRound.currentIndex - 1;

    // Update session cumulative stats
    const updatedSession = { ...studySession };
    if (currentRound.studiedCards.includes(prevCardId)) {
      // Check what type of answer this was
      const wasCorrect = currentRound.correctAnswers.includes(prevCardId);
      const wasIncorrect = currentRound.incorrectAnswers.includes(prevCardId);
      const wasSkipped = currentRound.skippedCards.includes(prevCardId);
      
      if (wasCorrect) {
        updatedSession.totalCorrectAnswers = Math.max(0, updatedSession.totalCorrectAnswers - 1);
        // 🔧 FIX: Only decrement totalCardsStudied for actual answers (not skips)
        updatedSession.totalCardsStudied = Math.max(0, updatedSession.totalCardsStudied - 1);
        
        // 🔧 FIX: If going back on a correct answer, we need to potentially re-add to missed cards
        // if this card was missed in any previous round
        const prevCard = currentRound.cards.find(card => card.id === prevCardId);
        if (prevCard) {
          // Check if this card was missed in earlier rounds by looking at all previous rounds
          const wasMissedInPreviousRounds = studySession.rounds.some((round, index) => 
            index < studySession.currentRoundIndex && 
            round.incorrectAnswers.includes(prevCardId)
          );
          if (wasMissedInPreviousRounds && !updatedSession.allMissedCards.find(card => card.id === prevCardId)) {
            updatedSession.allMissedCards = [...updatedSession.allMissedCards, prevCard];
          }
        }
      }
      if (wasIncorrect) {
        updatedSession.totalIncorrectAnswers = Math.max(0, updatedSession.totalIncorrectAnswers - 1);
        // 🔧 FIX: Only decrement totalCardsStudied for actual answers (not skips)
        updatedSession.totalCardsStudied = Math.max(0, updatedSession.totalCardsStudied - 1);
      }
      if (wasSkipped) {
        updatedSession.totalSkippedCards = Math.max(0, updatedSession.totalSkippedCards - 1);
        // 🔧 FIX: Skipped cards don't count as "studied", so don't decrement totalCardsStudied
      }
    }

    // Update session rounds array
    updatedSession.rounds[updatedSession.currentRoundIndex] = updatedRound;

    setCurrentRound(updatedRound);
    setStudySession(updatedSession);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
  }, [currentRound, studySession]);

  // Handle next card with smart animation
  const handleNext = useCallback((gotItRight?: boolean) => {
    if (!currentRound || !studySession || isTransitioning) return;

    const currentCard = currentRound.cards[currentRound.currentIndex];
    if (!currentCard || currentRound.studiedCards.includes(currentCard.id)) return;

    // Update current round stats
    const updatedRound = { ...currentRound };
    updatedRound.studiedCards = [...updatedRound.studiedCards, currentCard.id];
    
    // Update session cumulative stats
    const updatedSession = { ...studySession };
    
    if (gotItRight === true) {
      updatedRound.correctAnswers = [...updatedRound.correctAnswers, currentCard.id];
      updatedSession.totalCorrectAnswers += 1;
      // 🔧 FIX: Only count actual answers as "studied"
      updatedSession.totalCardsStudied += 1;
      
      // 🔧 FIX 1: Remove from all missed cards lists when answered correctly
      updatedSession.allMissedCards = updatedSession.allMissedCards.filter(
        card => card.id !== currentCard.id
      );
      // Also remove from current round's missed cards if it was there
      updatedRound.missedCards = updatedRound.missedCards.filter(
        card => card.id !== currentCard.id
      );
      
    } else if (gotItRight === false) {
      updatedRound.incorrectAnswers = [...updatedRound.incorrectAnswers, currentCard.id];
      updatedRound.missedCards = [...updatedRound.missedCards, currentCard];
      updatedSession.totalIncorrectAnswers += 1;
      // 🔧 FIX: Only count actual answers as "studied"
      updatedSession.totalCardsStudied += 1;
      
      // Add to overall missed cards if not already there
      if (!updatedSession.allMissedCards.find(card => card.id === currentCard.id)) {
        updatedSession.allMissedCards = [...updatedSession.allMissedCards, currentCard];
      }
    } else {
      // Skipped card logic
      updatedRound.skippedCards = [...updatedRound.skippedCards, currentCard.id];
      updatedSession.totalSkippedCards += 1;
      // 🔧 FIX: Skipped cards DON'T count as "studied"
      // Remove this line: updatedSession.totalCardsStudied += 1;
      
      // 🔧 NEW: Add skipped cards to missed cards for review
      updatedRound.missedCards = [...updatedRound.missedCards, currentCard];
      if (!updatedSession.allMissedCards.find(card => card.id === currentCard.id)) {
        updatedSession.allMissedCards = [...updatedSession.allMissedCards, currentCard];
      }
    }
    
    // Set feedback and show animation
    setFeedback(gotItRight === true ? "correct" : gotItRight === false ? "incorrect" : "skipped");
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (updatedRound.currentIndex < updatedRound.cards.length - 1) {
        // 🔧 FIX 2: Update session FIRST, then advance currentIndex
        updatedRound.currentIndex += 1;
        setCurrentRound(updatedRound);
        setStudySession(updatedSession); // Update session with cleaned missed cards
        setShowAnswer(false);
      } else {
        // Round complete
        updatedRound.endTime = new Date();
        updatedSession.rounds[updatedSession.currentRoundIndex] = updatedRound;
        setStudySession(updatedSession);
        setCurrentRound(updatedRound);
      }
      setFeedback(null);
      setIsTransitioning(false);
    }, 800);
  }, [currentRound, studySession, isTransitioning]);

  // Start reviewing all missed cards from entire session
  const startMissedCardsRound = useCallback(() => {
    if (!studySession || studySession.allMissedCards.length === 0) return;
    startNewRound(studySession.allMissedCards, 'missed');
  }, [studySession, startNewRound]);

  // Toggle keyboard help
  const toggleKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  // NEW: Clear controls error
  const clearControlsError = useCallback(() => {
    setControlsError(null);
  }, []);

  // Set up keyboard shortcuts
  useStudyKeyboard({
    showAnswer,
    currentIndex: currentRound?.currentIndex ?? 0,
    onShowAnswer: handleShowAnswer,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onShuffle: handleShuffleRound,
    onToggleHelp: toggleKeyboardHelp,
  });

  // Loading state
  if (!isLoaded || isLoading) {
    return null; // loading.tsx handles this
  }

  // Error state
  if (error) {
    return <StudyErrorState error={error} />;
  }

  // No cards state
  if (!set || !currentRound?.cards.length) {
    return <StudyNoCardsState />;
  }

  const isComplete = currentRound && currentRound.studiedCards.length === currentRound.cards.length;

  // Completion state
  if (isComplete && studySession && currentRound) {
    return (
      <StudyComplete
        studySession={studySession}
        currentRound={currentRound}
        onStudyEntireSet={studyEntireSet}
        onStartReviewRound={startReviewRound}
        onStartMissedCardsRound={startMissedCardsRound}
        onFinishSession={() => window.history.back()}
      />
    );
  }

  // Main study interface
  return (
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
      
      // UI state
      shuffled={shuffled}
      showKeyboardHelp={showKeyboardHelp}
      onToggleKeyboardHelp={toggleKeyboardHelp}
      
      // Loading and errors
      controlsLoading={controlsLoading}
      controlsError={controlsError}
      onClearControlsError={clearControlsError}
    />
  );
}
