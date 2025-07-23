"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { StudySession, StudyRound } from "@/lib/flashcards";

interface StudyCompleteProps {
  studySession: StudySession;
  currentRound: StudyRound;
  onStudyEntireSet: () => void;      // Study all original cards again
  onStartReviewRound: () => void;    // Review missed cards from current round
  onStartMissedCardsRound: () => void; // Review all missed cards from session
  onFinishSession: () => void;       // Exit study mode
}

export function StudyComplete({
  studySession,
  currentRound,
  onStudyEntireSet,
  onStartReviewRound,
  onStartMissedCardsRound,
  onFinishSession,
}: StudyCompleteProps) {
  // Current round stats
  const correctCount = currentRound.correctAnswers.length;
  const incorrectCount = currentRound.incorrectAnswers.length;
  const skippedCount = currentRound.skippedCards.length;
  const roundPercentage =
    currentRound.totalCards > 0
      ? Math.round((correctCount / currentRound.totalCards) * 100)
      : 0;

  // Round duration
  const roundDuration = currentRound.endTime
    ? Math.round(
        (currentRound.endTime.getTime() - currentRound.startTime.getTime()) / 1000
      )
    : 0;

  // Session duration (total time studying)
  const sessionDuration = Math.round(
    (Date.now() - studySession.startTime.getTime()) / 1000
  );

  // Session totals
  const sessionCorrectPercentage = studySession.totalCardsStudied > 0
    ? Math.round((studySession.totalCorrectAnswers / studySession.totalCardsStudied) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Round {currentRound.roundNumber} Complete!
          </h1>
          <div className="text-muted-foreground">
            <p>
              {currentRound.correctAnswers.length} correct, {' '}
              {currentRound.incorrectAnswers.length} incorrect, {' '}
              {currentRound.skippedCards.length} skipped
            </p>
            {currentRound.missedCards.length > 0 && (
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                {currentRound.missedCards.length} cards available for review
                <span className="text-xs text-muted-foreground block mt-1">
                  (includes incorrect and skipped cards)
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Round Results */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-foreground mb-3">This Round</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">✓ Correct:</span>
              <span className="font-medium">{correctCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">✗ Incorrect:</span>
              <span className="font-medium">{incorrectCount}</span>
            </div>
            {skippedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">— Skipped:</span>
                <span className="font-medium">{skippedCount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">⏱ Round Time:</span>
              <span className="font-medium">
                {Math.floor(roundDuration / 60)}:{(roundDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Round Score:</span>
                <span className={roundPercentage >= 70 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {roundPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-muted border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Study Session Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Rounds Completed:</span>
              <span className="font-medium">{studySession.rounds.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cards Studied:</span>
              <span className="font-medium">{studySession.totalCardsStudied}</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Accuracy:</span>
              <span className="font-medium">{sessionCorrectPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Time:</span>
              <span className="font-medium">
                {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
            {studySession.allMissedCards.length > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Cards Still Need Work:</span>
                <span className="font-medium">{studySession.allMissedCards.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Review missed cards from this round */}
          {currentRound.missedCards.length > 0 && (
            <Button onClick={onStartReviewRound} variant="outline" className="w-full">
              Review {currentRound.missedCards.length} Missed & Skipped Cards from This Round
            </Button>
          )}
          
          {/* Review all missed cards from entire session - only if different from current round */}
          {studySession.allMissedCards.length > 0 && studySession.allMissedCards.length !== currentRound.missedCards.length && (
            <Button onClick={onStartMissedCardsRound} variant="outline" className="w-full">
              Review All {studySession.allMissedCards.length} Missed & Skipped Cards
            </Button>
          )}
          
          {/* Show celebration message when no missed cards remain */}
          {studySession.allMissedCards.length === 0 && currentRound.missedCards.length === 0 && studySession.rounds.length > 1 && (
            <div className="text-center text-sm text-green-600 dark:text-green-400 py-2">
              🎉 Excellent! You&apos;ve mastered all previously missed cards.
            </div>
          )}
          
          {/* Study entire set again */}
          <Button onClick={onStudyEntireSet} className="w-full">
            Study Entire Set Again
          </Button>
          
          {/* Navigation */}
          <Link href={`/sets/${studySession.setId}`}>
            <Button variant="outline" className="w-full">
              View Set Details
            </Button>
          </Link>
          <Button onClick={onFinishSession} variant="ghost" className="w-full">
            Finish & Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
