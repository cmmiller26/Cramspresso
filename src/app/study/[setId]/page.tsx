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
import type { Flashcard, FlashcardSet } from "@/lib/flashcards";

interface StudySession {
  startTime: Date;
  endTime?: Date;
  totalCards: number;
  studiedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export default function StudyPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const setId = params.setId as string;

  // Core state
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Study tracking
  const [studiedCards, setStudiedCards] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [skippedCards, setSkippedCards] = useState<string[]>([]);
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);

  // UI state
  const [shuffled, setShuffled] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isReviewingMissed, setIsReviewingMissed] = useState(false);
  const [feedback, setFeedback] = useState<
    "correct" | "incorrect" | "skipped" | null
  >(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
        setStudyCards(data.cards);

        // Initialize study session
        setStudySession({
          startTime: new Date(),
          totalCards: data.cards.length,
          studiedCards: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSet();
  }, [setId, isSignedIn]);

  // Clear feedback when card changes
  useEffect(() => {
    setFeedback(null);
    setIsTransitioning(false);
  }, [currentIndex]);

  // Reset session data
  const resetSession = useCallback(() => {
    if (!set) return;

    setStudiedCards([]);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setSkippedCards([]);
    setMissedCards([]);
    setIsReviewingMissed(false);
    setStudySession({
      startTime: new Date(),
      totalCards: set.cards.length,
      studiedCards: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
    });
  }, [set]);

  // Shuffle cards
  const shuffleCards = useCallback(() => {
    if (!set) return;

    const shuffledCards = [...set.cards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffledCards);
    setShuffled(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    resetSession();
  }, [set, resetSession]);

  // Reset to original order
  const resetCards = useCallback(() => {
    if (!set) return;

    setStudyCards([...set.cards]);
    setShuffled(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    resetSession();
  }, [set, resetSession]);

  // Handle showing answer
  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  // Handle previous card - clears any previous answer for that card
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevCardId = studyCards[currentIndex - 1]?.id;

      if (prevCardId) {
        // Remove previous card from all answer arrays to reset it
        setStudiedCards((prev) => prev.filter((id) => id !== prevCardId));
        setCorrectAnswers((prev) => prev.filter((id) => id !== prevCardId));
        setIncorrectAnswers((prev) => prev.filter((id) => id !== prevCardId));
        setSkippedCards((prev) => prev.filter((id) => id !== prevCardId));
        setMissedCards((prev) => prev.filter((card) => card.id !== prevCardId));

        // Update session stats
        setStudySession((prev) =>
          prev
            ? {
                ...prev,
                studiedCards: Math.max(0, prev.studiedCards - 1),
                correctAnswers: correctAnswers.includes(prevCardId)
                  ? Math.max(0, prev.correctAnswers - 1)
                  : prev.correctAnswers,
                incorrectAnswers: incorrectAnswers.includes(prevCardId)
                  ? Math.max(0, prev.incorrectAnswers - 1)
                  : prev.incorrectAnswers,
              }
            : null
        );
      }

      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
      setFeedback(null);
      setIsTransitioning(false);
    }
  }, [currentIndex, studyCards, correctAnswers, incorrectAnswers]);

  // Handle next card with smart animation
  const handleNext = useCallback(
    (gotItRight?: boolean) => {
      if (!studyCards.length || !studySession || isTransitioning) return;

      const currentCard = studyCards[currentIndex];
      if (!currentCard || studiedCards.includes(currentCard.id)) return;

      // Determine if we should show animation
      // Show animation for:
      // 1. When answer is visible and user makes a choice (Yes/No)
      // 2. When skipping (right arrow or skip button) regardless of answer visibility
      const shouldShowAnimation =
        (showAnswer && (gotItRight === true || gotItRight === false)) || // Yes/No with answer shown
        gotItRight === undefined; // Skip action (right arrow or skip button)

      // Set feedback based on choice
      let feedbackType: "correct" | "incorrect" | "skipped" | null = null;
      if (gotItRight === true) feedbackType = "correct";
      else if (gotItRight === false) feedbackType = "incorrect";
      else feedbackType = "skipped";

      // Update tracking arrays
      setStudiedCards((prev) => [...prev, currentCard.id]);

      if (gotItRight === true) {
        setCorrectAnswers((prev) => [...prev, currentCard.id]);
      } else if (gotItRight === false) {
        setIncorrectAnswers((prev) => [...prev, currentCard.id]);
        setMissedCards((prev) => [...prev, currentCard]);
      } else {
        setSkippedCards((prev) => [...prev, currentCard.id]);
      }

      // Update session stats
      setStudySession((prev) =>
        prev
          ? {
              ...prev,
              studiedCards: prev.studiedCards + 1,
              correctAnswers:
                gotItRight === true
                  ? prev.correctAnswers + 1
                  : prev.correctAnswers,
              incorrectAnswers:
                gotItRight === false
                  ? prev.incorrectAnswers + 1
                  : prev.incorrectAnswers,
            }
          : null
      );

      if (shouldShowAnimation) {
        // Show animation then advance
        setFeedback(feedbackType);
        setIsTransitioning(true);

        setTimeout(() => {
          // Move to next card or complete
          if (currentIndex < studyCards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setShowAnswer(false);
          } else {
            setStudySession((prev) =>
              prev ? { ...prev, endTime: new Date() } : null
            );
          }
          setFeedback(null);
          setIsTransitioning(false);
        }, 800);
      } else {
        // This case should rarely happen now, but keeping for safety
        if (currentIndex < studyCards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setShowAnswer(false);
        } else {
          setStudySession((prev) =>
            prev ? { ...prev, endTime: new Date() } : null
          );
        }
      }
    },
    [
      studyCards,
      studySession,
      currentIndex,
      studiedCards,
      showAnswer,
      isTransitioning,
    ]
  );

  // Restart study session
  const handleRestart = useCallback(() => {
    if (!set) return;

    setStudyCards([...set.cards]);
    setShuffled(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    resetSession();
  }, [set, resetSession]);

  // Start reviewing missed/skipped cards
  const startReviewSession = useCallback(() => {
    const cardsToReview = [...missedCards];

    // Add skipped cards to review
    const skippedCardObjects =
      set?.cards.filter((card) => skippedCards.includes(card.id)) || [];
    skippedCardObjects.forEach((card) => {
      if (!cardsToReview.find((c) => c.id === card.id)) {
        cardsToReview.push(card);
      }
    });

    if (cardsToReview.length === 0) return;

    setStudyCards(cardsToReview);
    setIsReviewingMissed(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFeedback(null);
    setIsTransitioning(false);
    setStudiedCards([]);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
    setSkippedCards([]);
    setMissedCards([]);

    // Start new session for review cards
    setStudySession({
      startTime: new Date(),
      totalCards: cardsToReview.length,
      studiedCards: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
    });
  }, [missedCards, skippedCards, set]);

  // Toggle keyboard help
  const toggleKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp((prev) => !prev);
  }, []);

  // Set up keyboard shortcuts
  useStudyKeyboard({
    showAnswer,
    currentIndex,
    onShowAnswer: handleShowAnswer,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onShuffle: shuffleCards,
    onRestart: handleRestart,
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
  if (!set || !studyCards.length) {
    return <StudyNoCardsState />;
  }

  const isComplete = studiedCards.length === studyCards.length;

  // Completion state
  if (isComplete && studySession) {
    return (
      <StudyComplete
        setId={setId}
        setName={set.name}
        studyCards={studyCards}
        correctAnswers={correctAnswers}
        incorrectAnswers={incorrectAnswers}
        skippedCards={skippedCards}
        missedCards={missedCards}
        studySession={studySession}
        isReviewingMissed={isReviewingMissed}
        onRestart={handleRestart}
        onStartReviewSession={startReviewSession}
      />
    );
  }

  // Main study interface
  return (
    <StudyInterface
      setId={setId}
      setName={set.name}
      studyCards={studyCards}
      currentIndex={currentIndex}
      showAnswer={showAnswer}
      shuffled={shuffled}
      showKeyboardHelp={showKeyboardHelp}
      isReviewingMissed={isReviewingMissed}
      studySession={studySession}
      studiedCards={studiedCards}
      feedback={feedback}
      isTransitioning={isTransitioning}
      onShowAnswer={handleShowAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onShuffle={shuffleCards}
      onReset={resetCards}
      onRestart={handleRestart}
      onToggleKeyboardHelp={toggleKeyboardHelp}
    />
  );
}
