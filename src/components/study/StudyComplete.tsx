"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton"; // ✅ ADD
import { Trophy, Clock, Target, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { StudySession, StudyRound } from "@/lib/flashcards";

interface StudyCompleteProps {
  studySession: StudySession;
  currentRound: StudyRound;
  onStudyEntireSet: () => void;
  onStartReviewRound: () => void;
  onStartMissedCardsRound: () => void;
  onFinishSession: () => void;
}

export const StudyComplete = memo(function StudyComplete({
  studySession,
  currentRound,
  onStudyEntireSet,
  onStartReviewRound,
  onStartMissedCardsRound,
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
        (currentRound.endTime.getTime() - currentRound.startTime.getTime()) /
          1000
      )
    : 0;

  // Session duration
  const sessionDuration = Math.round(
    (Date.now() - studySession.startTime.getTime()) / 1000
  );

  // Session totals
  const sessionCorrectPercentage =
    studySession.totalCardsStudied > 0
      ? Math.round(
          (studySession.totalCorrectAnswers / studySession.totalCardsStudied) *
            100
        )
      : 0;

  // Logic for different scenarios
  const hasCurrentRoundMissedCards = currentRound.missedCards.length > 0;
  const hasSessionMissedCards = studySession.allMissedCards.length > 0;
  const hasDifferentMissedCounts =
    hasSessionMissedCards &&
    studySession.allMissedCards.length !== currentRound.missedCards.length;
  const hasCompletedMultipleRounds = studySession.rounds.length > 1;
  const isPerfectRound = correctCount === currentRound.totalCards;

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {isPerfectRound ? (
              <Trophy className="h-16 w-16 text-yellow-500" />
            ) : (
              <Target className="h-16 w-16 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isPerfectRound ? "Perfect Round!" : "Round Complete!"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Round {currentRound.roundNumber} •{" "}
            {currentRound.roundType.charAt(0).toUpperCase() +
              currentRound.roundType.slice(1)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Round Results */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                This Round
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Correct
                </span>
                <span className="font-semibold text-lg">{correctCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Incorrect
                </span>
                <span className="font-semibold text-lg">{incorrectCount}</span>
              </div>

              {skippedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    Skipped
                  </span>
                  <span className="font-semibold text-lg">{skippedCount}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Time
                  </span>
                  <span className="font-semibold">
                    {formatTime(roundDuration)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score</span>
                  <span
                    className={`font-bold text-xl ${
                      roundPercentage >= 90
                        ? "text-green-600 dark:text-green-400"
                        : roundPercentage >= 70
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {roundPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Summary */}
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Session Summary
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Rounds Completed</span>
                <span className="font-semibold">
                  {studySession.rounds.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Total Cards Studied</span>
                <span className="font-semibold">
                  {studySession.totalCardsStudied}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Overall Accuracy</span>
                <span
                  className={`font-semibold ${
                    sessionCorrectPercentage >= 80
                      ? "text-green-600 dark:text-green-400"
                      : sessionCorrectPercentage >= 60
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {sessionCorrectPercentage}%
                </span>
              </div>

              <div className="flex justify-between">
                <span>Total Study Time</span>
                <span className="font-semibold">
                  {formatTime(sessionDuration)}
                </span>
              </div>

              {hasSessionMissedCards && (
                <div className="border-t border-border pt-3 mt-4">
                  <div className="flex justify-between">
                    <span className="text-amber-600 dark:text-amber-400">
                      Cards Need Review
                    </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {studySession.allMissedCards.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Celebration Message */}
        {isPerfectRound && (
          <div className="text-center mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 font-medium">
              🎉 Fantastic! You got every card right in this round!
            </p>
          </div>
        )}

        {!hasSessionMissedCards &&
          !hasCurrentRoundMissedCards &&
          hasCompletedMultipleRounds && (
            <div className="text-center mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 font-medium">
                🏆 Excellent! You&apos;ve mastered all the cards from this set!
              </p>
            </div>
          )}

        {/* Action Buttons */}
        <div className="max-w-md mx-auto space-y-3">
          {/* Review Options */}
          {hasCurrentRoundMissedCards && (
            <LoadingButton
              onClick={onStartReviewRound}
              variant="outline"
              className="w-full h-12 text-left flex items-center justify-between"
            >
              <span>
                Review {currentRound.missedCards.length} cards from this round
              </span>
              <RotateCcw className="h-4 w-4" />
            </LoadingButton>
          )}

          {hasDifferentMissedCounts && (
            <LoadingButton
              onClick={onStartMissedCardsRound}
              variant="outline"
              className="w-full h-12 text-left flex items-center justify-between"
            >
              <span>
                Review all {studySession.allMissedCards.length} missed cards
              </span>
              <RotateCcw className="h-4 w-4" />
            </LoadingButton>
          )}

          {/* Study Again */}
          <LoadingButton
            onClick={onStudyEntireSet}
            className="w-full h-12 text-left flex items-center justify-between"
          >
            <span>Study entire set again</span>
            <Target className="h-4 w-4" />
          </LoadingButton>

          {/* Back to Set */}
          <Link href={`/sets/${studySession.setId}`} className="block">
            <Button
              variant="ghost"
              className="w-full h-12 text-left flex items-center justify-between"
            >
              <span>Back to set details</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
});
