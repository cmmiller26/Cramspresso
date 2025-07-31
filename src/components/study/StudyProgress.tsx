"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { StudySession, StudyRound } from "@/lib/types/flashcards";

interface StudyProgressProps {
  studySession: StudySession;
  currentRound: StudyRound;
}

export function StudyProgress({
  studySession,
  currentRound,
}: StudyProgressProps) {
  // 🔧 FIX 2: Use currentIndex for progress, not currentIndex + 1
  // This shows accurate progress: 0% at start, advances after completing cards
  const currentProgress = currentRound.currentIndex; // Current position (0-based)
  const totalCards = currentRound.totalCards;
  const progressPercentage =
    totalCards > 0 ? (currentProgress / totalCards) * 100 : 0;

  // Use studiedCards.length for the "completed" count since that's accurate
  const completedCards = currentRound.studiedCards.length;
  const studiedPercentage =
    totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Current round progress */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              Round {currentRound.roundNumber}: Card{" "}
              {currentRound.currentIndex + 1} of {currentRound.totalCards}
            </span>
            <span className="text-sm text-muted-foreground">
              {completedCards} completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress
              value={progressPercentage}
              className="h-2"
              aria-label={`Round progress: ${currentProgress} of ${totalCards} cards completed`}
            />

            {/* Round stats */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(studiedPercentage)}% completed</span>
              <span>{totalCards - completedCards} remaining</span>
            </div>
          </div>

          {/* Session totals */}
          <div className="pt-2 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Cards answered:</span>
                <span>
                  {studySession.totalCardsStudied} (
                  {studySession.totalCorrectAnswers} correct,{" "}
                  {studySession.totalIncorrectAnswers} incorrect)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cards skipped:</span>
                <span>{studySession.totalSkippedCards}</span>
              </div>
              {studySession.allMissedCards.length > 0 && (
                <div className="flex justify-between">
                  <span>Need review:</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {studySession.allMissedCards.length} cards
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
