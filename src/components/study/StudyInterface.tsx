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
  
  // UI state
  shuffled: boolean;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;
  
  // Loading and errors
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
  
  // UI state
  shuffled,
  showKeyboardHelp,
  onToggleKeyboardHelp,
  
  // Loading and errors
  controlsLoading = { shuffle: false, reset: false },
  controlsError,
  onClearControlsError,
}: StudyInterfaceProps) {
  if (!currentRound || !studySession) {
    return <div>Loading...</div>;
  }

  const currentCard = currentRound.cards[currentRound.currentIndex];
  const isLastCard = currentRound.currentIndex === currentRound.cards.length - 1;
  const anyControlLoading =
    controlsLoading.shuffle || controlsLoading.reset;

  // Determine header text based on round type
  const getHeaderText = () => {
    switch (currentRound.roundType) {
      case 'review':
        return "Reviewing Missed Cards";
      case 'missed':
        return "Reviewing All Missed Cards";
      case 'initial':
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
            Round {currentRound.roundNumber} • {currentRound.roundType}
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

      {/* Controls Error Banner */}
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
        <StudyTimer
          studySession={studySession}
          currentRound={currentRound}
        />
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
