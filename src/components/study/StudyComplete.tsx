"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Flashcard } from "@/lib/flashcards";

interface StudySession {
  startTime: Date;
  endTime?: Date;
  totalCards: number;
  studiedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

interface StudyCompleteProps {
  setId: string;
  setName: string;
  studyCards: Flashcard[];
  correctAnswers: string[];
  incorrectAnswers: string[];
  skippedCards: string[];
  missedCards: Flashcard[];
  studySession: StudySession;
  isReviewingMissed: boolean;
  onRestart: () => void;
  onStartReviewSession: () => void;
}

export function StudyComplete({
  setId,
  setName,
  studyCards,
  correctAnswers,
  incorrectAnswers,
  skippedCards,
  missedCards,
  studySession,
  isReviewingMissed,
  onRestart,
  onStartReviewSession,
}: StudyCompleteProps) {
  const correctCount = correctAnswers.length;
  const incorrectCount = incorrectAnswers.length;
  const skippedCount = skippedCards.length;
  const percentage =
    studyCards.length > 0
      ? Math.round((correctCount / studyCards.length) * 100)
      : 0;
  const sessionDuration = studySession.endTime
    ? Math.round(
        (studySession.endTime.getTime() - studySession.startTime.getTime()) /
          1000
      )
    : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {isReviewingMissed ? "Review Complete!" : "Study Complete!"}
        </h1>
        <p className="text-muted-foreground mb-6">
          You&apos;ve completed {isReviewingMissed ? "reviewing" : "studying"}{" "}
          all {studyCards.length} cards
          {isReviewingMissed ? " from your missed cards" : ` in "${setName}"`}.
        </p>

        {/* Results Summary */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Your Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">
                ✓ Correct:
              </span>
              <span className="font-medium">{correctCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">
                ✗ Incorrect:
              </span>
              <span className="font-medium">{incorrectCount}</span>
            </div>
            {skippedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">— Skipped:</span>
                <span className="font-medium">{skippedCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">⏱ Time:</span>
              <span className="font-medium">
                {Math.floor(sessionDuration / 60)}:
                {(sessionDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Score:</span>
                <span
                  className={
                    percentage >= 70
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {!isReviewingMissed &&
            (missedCards.length > 0 || skippedCards.length > 0) && (
              <Button
                onClick={onStartReviewSession}
                variant="outline"
                className="w-full"
              >
                Review {missedCards.length + skippedCards.length} Cards Again
              </Button>
            )}
          {isReviewingMissed &&
            (missedCards.length > 0 || skippedCards.length > 0) && (
              <Button
                onClick={onStartReviewSession}
                variant="outline"
                className="w-full"
              >
                Keep Reviewing ({missedCards.length + skippedCards.length} cards
                left)
              </Button>
            )}
          <Button onClick={onRestart} className="w-full">
            Study Again
          </Button>
          <Link href={`/sets/${setId}`}>
            <Button variant="outline" className="w-full">
              View Set Details
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
