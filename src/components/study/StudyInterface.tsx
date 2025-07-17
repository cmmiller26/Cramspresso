"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard } from "lucide-react";
import Link from "next/link";
import { StudyCard } from "./StudyCard";
import { StudyProgress } from "./StudyProgress";
import { StudyControls } from "./StudyControls";
import { StudyTimer } from "./StudyTimer";
import { StudyKeyboardShortcuts } from "./StudyKeyboardShortcuts";
import type { Flashcard } from "@/lib/flashcards";

interface StudySession {
  startTime: Date;
  endTime?: Date;
  totalCards: number;
  studiedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface StudyInterfaceProps {
  setId: string;
  setName: string;
  studyCards: Flashcard[];
  currentIndex: number;
  showAnswer: boolean;
  shuffled: boolean;
  showKeyboardHelp: boolean;
  isReviewingMissed: boolean;
  studySession: StudySession | null;
  studiedCards: string[];
  feedback: "correct" | "incorrect" | "skipped" | null;
  isTransitioning: boolean;
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onReset: () => void;
  onRestart: () => void;
  onToggleKeyboardHelp: () => void;
}

export function StudyInterface({
  setId,
  setName,
  studyCards,
  currentIndex,
  showAnswer,
  shuffled,
  showKeyboardHelp,
  isReviewingMissed,
  studySession,
  studiedCards,
  feedback,
  isTransitioning,
  onShowAnswer,
  onNext,
  onPrevious,
  onShuffle,
  onReset,
  onRestart,
  onToggleKeyboardHelp,
}: StudyInterfaceProps) {
  const currentCard = studyCards[currentIndex];
  const isLastCard = currentIndex === studyCards.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header - CORRECTLY CENTERED */}
      <div className="flex items-center mb-6">
        <div className="flex-1 flex justify-start">
          <Link href={`/sets/${setId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Set
            </Button>
          </Link>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {isReviewingMissed
              ? "Reviewing Missed Cards"
              : `Studying: ${setName}`}
          </h1>
        </div>
        <div className="flex-1 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onToggleKeyboardHelp}>
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard Help */}
      <StudyKeyboardShortcuts isVisible={showKeyboardHelp} />

      {/* Timer and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StudyProgress
          currentIndex={currentIndex}
          totalCards={studyCards.length}
          studiedCards={studiedCards.length}
        />
        {studySession && <StudyTimer startTime={studySession.startTime} />}
      </div>

      {/* Study Controls */}
      <div className="mb-6">
        <StudyControls
          shuffled={shuffled}
          onShuffle={onShuffle}
          onReset={onReset}
          onRestart={onRestart}
          currentIndex={currentIndex}
          totalCards={studyCards.length}
          onPrevious={onPrevious}
          canGoPrevious={currentIndex > 0}
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
        />
      </div>
    </div>
  );
}
