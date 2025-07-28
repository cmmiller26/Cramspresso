"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { StudyCard } from "./StudyCard";
import { StudyProgress } from "./StudyProgress";
import { StudyControls } from "./StudyControls";
import { StudyTimer } from "./StudyTimer";
import { StudyKeyboardShortcuts } from "./StudyKeyboardShortcuts";
import { StudyComplete } from "./StudyComplete";
import type { StudySession, StudyRound } from "@/lib/flashcards";

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

  // Round management
  onShuffleRound: () => Promise<void>;
  onResetToOriginal: () => Promise<void>;
  onStartReviewRound?: (session: StudySession, round: StudyRound) => void;
  onRestartStudySession?: () => void;

  // UI state
  shuffled: boolean;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;

  // Loading and error states
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
  onStartReviewRound,
  onRestartStudySession,

  // UI state
  shuffled,
  showKeyboardHelp,
  onToggleKeyboardHelp,

  // Loading and error handling with better defaults
  controlsLoading = { shuffle: false, reset: false },
  controlsError,
  onClearControlsError,
}: StudyInterfaceProps) {
  if (!currentRound || !studySession) {
    return <div>Loading...</div>;
  }

  // Check if round is complete
  const isRoundComplete = currentRound.currentIndex >= currentRound.totalCards;

  // Use dedicated StudyComplete component for completion
  if (isRoundComplete) {
    return (
      <StudyComplete
        studySession={studySession}
        currentRound={currentRound}
        onStudyEntireSet={() => {
          if (onRestartStudySession) {
            onRestartStudySession();
          }
        }}
        onStartReviewRound={() => {
          if (onStartReviewRound && currentRound.missedCards.length > 0) {
            const reviewRound: StudyRound = {
              roundNumber: currentRound.roundNumber + 1,
              roundType: "review",
              startTime: new Date(),
              cards: currentRound.missedCards,
              currentIndex: 0,
              totalCards: currentRound.missedCards.length,
              studiedCards: [],
              correctAnswers: [],
              incorrectAnswers: [],
              skippedCards: [],
              missedCards: [],
            };

            const updatedSession = {
              ...studySession,
              currentRoundIndex: studySession.currentRoundIndex + 1,
              rounds: [...studySession.rounds, reviewRound],
            };

            onStartReviewRound(updatedSession, reviewRound);
          }
        }}
        onStartMissedCardsRound={() => {
          if (onStartReviewRound && studySession.allMissedCards.length > 0) {
            const missedCardsRound: StudyRound = {
              roundNumber: currentRound.roundNumber + 1,
              roundType: "missed",
              startTime: new Date(),
              cards: studySession.allMissedCards,
              currentIndex: 0,
              totalCards: studySession.allMissedCards.length,
              studiedCards: [],
              correctAnswers: [],
              incorrectAnswers: [],
              skippedCards: [],
              missedCards: [],
            };

            const updatedSession = {
              ...studySession,
              currentRoundIndex: studySession.currentRoundIndex + 1,
              rounds: [...studySession.rounds, missedCardsRound],
            };

            onStartReviewRound(updatedSession, missedCardsRound);
          }
        }}
        onFinishSession={() => {
          window.location.href = `/sets/${studySession.setId}`;
        }}
      />
    );
  }

  // Continue with normal study interface for active rounds
  const currentCard = currentRound.cards[currentRound.currentIndex];
  const isLastCard =
    currentRound.currentIndex === currentRound.cards.length - 1;
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
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex-1 flex justify-start">
          <Link href={`/sets/${studySession.setId}`}>
            <Button variant="ghost" size="sm" disabled={anyControlLoading}>
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
            disabled={anyControlLoading}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced controls error banner */}
      {controlsError && onClearControlsError && (
        <div className="mb-4 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive mb-1">Control Error</h4>
            <p className="text-sm text-destructive/80">{controlsError}</p>
          </div>
          <Button
            onClick={onClearControlsError}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
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

      {/* Study Controls */}
      <div className="mb-6">
        <StudyControls
          shuffled={shuffled}
          onShuffle={onShuffleRound}
          onResetToOriginal={onResetToOriginal}
          currentIndex={currentRound.currentIndex}
          totalCards={currentRound.totalCards}
          onPrevious={onPrevious}
          canGoPrevious={currentRound.currentIndex > 0}
          isLoading={controlsLoading}
          disabled={anyControlLoading}
        />
      </div>

      {/* Study Card */}
      <div className="flex justify-center">
        <StudyCard
          flashcard={currentCard}
          showAnswer={showAnswer}
          onShowAnswer={onShowAnswer}
          onNext={onNext}
          isLastCard={isLastCard}
          feedback={feedback}
          isTransitioning={isTransitioning}
          disabled={anyControlLoading}
        />
      </div>
    </div>
  );
}
