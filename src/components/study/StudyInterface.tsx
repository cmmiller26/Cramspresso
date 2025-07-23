"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { StudyCard } from "./StudyCard";
import { StudyProgress } from "./StudyProgress";
import { StudyControls } from "./StudyControls";
import { StudyTimer } from "./StudyTimer";
import { StudyKeyboardShortcuts } from "./StudyKeyboardShortcuts";
import type { StudySession, StudyRound } from "@/lib/flashcards";

// ✅ UPDATED: Props interface using correct imported types
interface StudyInterfaceProps {
  // Session and round data
  studySession: StudySession | null;
  currentRound: StudyRound | null;

  // Current card state
  showAnswer: boolean;
  feedback: "correct" | "incorrect" | "skipped" | null;
  isTransitioning: boolean;

  // Actions
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  onPrevious: () => void;

  // Round management - ✅ UPDATED: Now async functions
  onShuffleRound: () => Promise<void>;
  onResetToOriginal: () => Promise<void>;
  onStartReviewRound?: (session: StudySession, round: StudyRound) => void;
  onRestartStudySession?: () => void; // NEW

  // UI state
  shuffled: boolean;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;

  // ✅ UPDATED: Loading and error states
  controlsLoading?: {
    shuffle: boolean;
    reset: boolean;
  };
  controlsError?: string | null;
  onClearControlsError?: () => void;
}

export function StudyInterface({
  // Session and round data
  studySession,
  currentRound,

  // Current card state
  showAnswer,
  feedback,
  isTransitioning,

  // Actions
  onShowAnswer,
  onNext,
  onPrevious,

  // Round management
  onShuffleRound,
  onResetToOriginal,
  onStartReviewRound, // NEW
  onRestartStudySession, // NEW

  // UI state
  shuffled,
  showKeyboardHelp,
  onToggleKeyboardHelp,

  // ✅ UPDATED: Loading and error handling with better defaults
  controlsLoading = { shuffle: false, reset: false },
  controlsError,
  onClearControlsError,
}: StudyInterfaceProps) {
  if (!currentRound || !studySession) {
    return <div>Loading...</div>;
  }

  // ✅ FIX: Check if round is complete
  const isRoundComplete = currentRound.currentIndex >= currentRound.totalCards;

  // ✅ FIX: Handle round completion - show completion screen instead of trying to access invalid card
  if (isRoundComplete) {
    const hasSkippedOrIncorrect = currentRound.missedCards.length > 0;
    const completionMessage = hasSkippedOrIncorrect
      ? `${currentRound.missedCards.length} cards still need review`
      : "Perfect! All cards have been mastered";

    // Check if ALL cards from the original set have been mastered across all rounds
    // Collect all cards that have been answered correctly across all rounds
    const allCorrectCardIds = new Set<string>();
    studySession.rounds.forEach((round) => {
      round.correctAnswers.forEach((cardId) => allCorrectCardIds.add(cardId));
    });

    // Check if the number of correctly answered cards equals the original set size
    const allCardsMastered =
      allCorrectCardIds.size === studySession.originalSetSize;

    // Show "Study Again" if all cards have been mastered AND current round has no missed cards
    const showStudyAgain = allCardsMastered && !hasSkippedOrIncorrect;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            🎉 Round Complete!
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {completionMessage}
          </p>

          {/* Show round statistics */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Round Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cards Answered:</span>
                <span>
                  {currentRound.correctAnswers.length +
                    currentRound.incorrectAnswers.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Correct:</span>
                <span className="text-green-600">
                  {currentRound.correctAnswers.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Incorrect:</span>
                <span className="text-red-600">
                  {currentRound.incorrectAnswers.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Skipped:</span>
                <span className="text-gray-600">
                  {currentRound.skippedCards.length}
                </span>
              </div>
              {currentRound.missedCards.length > 0 && (
                <div className="flex justify-between">
                  <span>Need Review:</span>
                  <span className="text-amber-600">
                    {currentRound.missedCards.length}
                  </span>
                </div>
              )}
            </div>

            {/* Show overall mastery progress */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Mastery:</span>
                <span>
                  {allCorrectCardIds.size}/{studySession.originalSetSize} cards
                  mastered
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            <Link href={`/sets/${studySession.setId}`}>
              <Button variant="outline">Back to Set</Button>
            </Link>

            {/* Show Study Again if ALL cards have been mastered */}
            {showStudyAgain && onRestartStudySession && (
              <Button onClick={onRestartStudySession} variant="default">
                Study Again
              </Button>
            )}

            {/* Only show Review if there are missed cards */}
            {currentRound.missedCards.length > 0 && (
              <Button
                onClick={() => {
                  // Start a new review round with missed cards
                  const reviewRound: StudyRound = {
                    roundNumber: currentRound.roundNumber + 1,
                    roundType: "review",
                    startTime: new Date(),
                    cards: currentRound.missedCards, // Only the missed cards
                    currentIndex: 0,
                    totalCards: currentRound.missedCards.length,
                    studiedCards: [],
                    correctAnswers: [],
                    incorrectAnswers: [],
                    skippedCards: [],
                    missedCards: [],
                  };

                  // Add the review round to the session
                  const updatedSession = {
                    ...studySession,
                    currentRoundIndex: studySession.currentRoundIndex + 1,
                    rounds: [...studySession.rounds, reviewRound],
                  };

                  // Update the session and start the review round
                  if (onStartReviewRound) {
                    onStartReviewRound(updatedSession, reviewRound);
                  }
                }}
              >
                Review Missed Cards ({currentRound.missedCards.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ SAFE: Only access currentCard if round is not complete
  const currentCard = currentRound.cards[currentRound.currentIndex];
  const isLastCard =
    currentRound.currentIndex === currentRound.cards.length - 1;

  // ✅ UPDATED: Check for any control loading
  const anyControlLoading = controlsLoading.shuffle || controlsLoading.reset;

  // Determine header text based on round type
  const getHeaderText = () => {
    switch (currentRound.roundType) {
      case "review":
        return "Reviewing Missed Cards";
      case "missed":
        return "Reviewing All Missed Cards";
      case "initial":
      default:
        return `Studying: ${studySession.setName}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header - CORRECTLY CENTERED */}
      <div className="flex items-center mb-6">
        <div className="flex-1 flex justify-start">
          <Link href={`/sets/${studySession.setId}`}>
            <Button
              variant="ghost"
              size="sm"
              disabled={anyControlLoading} // ✅ NEW: Disable during loading
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Set
            </Button>
          </Link>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {getHeaderText()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Round {currentRound.roundNumber} •{" "}
            {currentRound.roundType.charAt(0).toUpperCase() +
              currentRound.roundType.slice(1)}
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleKeyboardHelp}
            disabled={anyControlLoading} // ✅ NEW: Disable during loading
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ✅ NEW: Controls Error Banner */}
      {controlsError && onClearControlsError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span className="text-destructive flex-1">{controlsError}</span>
          <Button
            onClick={onClearControlsError}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
          >
            ×
          </Button>
        </div>
      )}

      {/* Keyboard Help */}
      <StudyKeyboardShortcuts isVisible={showKeyboardHelp} />

      {/* Timer and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StudyProgress
          studySession={studySession}
          currentRound={currentRound}
        />
        <StudyTimer studySession={studySession} currentRound={currentRound} />
      </div>

      {/* ✅ UPDATED: Study Controls with loading props */}
      <div className="mb-6">
        <StudyControls
          shuffled={shuffled}
          onShuffle={onShuffleRound}
          onResetToOriginal={onResetToOriginal}
          currentIndex={currentRound.currentIndex}
          totalCards={currentRound.totalCards}
          onPrevious={onPrevious}
          canGoPrevious={currentRound.currentIndex > 0}
          isLoading={controlsLoading} // ✅ NEW: Pass loading states
          disabled={anyControlLoading} // ✅ NEW: Disable all controls during loading
        />
      </div>

      {/* ✅ UPDATED: Study Card with disabled prop */}
      <div className="flex justify-center">
        <StudyCard
          flashcard={currentCard}
          showAnswer={showAnswer}
          onShowAnswer={onShowAnswer}
          onNext={onNext}
          isLastCard={isLastCard}
          feedback={feedback}
          isTransitioning={isTransitioning}
          disabled={anyControlLoading} // ✅ NEW: Disable card during control operations
        />
      </div>
    </div>
  );
}
