"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useStudyState } from "@/hooks/study";
import { StudyInterface } from "@/components/study/StudyInterface";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  StudyCardSkeleton,
  StudyProgressSkeleton,
} from "@/components/shared/SkeletonLoader"; // ✅ ADD
import { ErrorState, StudyModeError } from "@/components/shared/ErrorStates"; // ✅ IMPROVED

export default function StudyPage() {
  const { setId } = useParams() as { setId: string };
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const {
    // Data state
    setData,
    studySession,
    currentRound,

    // Card interaction state
    showAnswer,
    feedback,
    isTransitioning,

    // UI state
    shuffled,
    showKeyboardHelp,

    // Loading and error state
    loading,
    error,
    controlsLoading,
    controlsError,

    // Actions
    actions,
  } = useStudyState(setId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // ✅ IMPROVED: Better auth loading state
  if (!isLoaded || !isSignedIn) {
    return (
      <LoadingSpinner
        size="lg"
        text="Checking authentication..."
        overlay={true} // ✅ Use overlay for full-screen loading
      />
    );
  }

  // ✅ IMPROVED: Use skeleton loading for initial load
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header skeleton */}
        <div className="flex items-center mb-6">
          <div className="flex-1 flex justify-start">
            <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto"></div>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="h-9 w-9 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Progress and timer skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StudyProgressSkeleton />
          <StudyProgressSkeleton />
        </div>

        {/* Controls skeleton */}
        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Card skeleton */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <StudyCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // ✅ IMPROVED: Better error state with specific study error component
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <StudyModeError
          onRetry={actions.loadSet}
          onGoBack={() => router.push("/dashboard")}
        />
      </div>
    );
  }

  // ✅ IMPROVED: Better no-data error state
  if (!setData || !studySession || !currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorState
          title="No flashcards found"
          message="This set doesn't contain any cards to study, or there was a problem loading them."
          onRetry={actions.loadSet}
          className="max-w-md"
        />
      </div>
    );
  }

  // ✅ IMPROVED: Check for empty set
  if (setData.cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorState
          title="No cards to study"
          message="This flashcard set is empty. Add some cards before starting a study session."
          showRetry={false}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <>
      <title>{`Studying: ${studySession.setName} - Cramspresso`}</title>
      <StudyInterface
        // Session and round data
        studySession={studySession}
        currentRound={currentRound}
        // Current card state
        showAnswer={showAnswer}
        feedback={feedback}
        isTransitioning={isTransitioning}
        // Actions (all properly memoized in the hook)
        onShowAnswer={actions.onShowAnswer}
        onNext={actions.onNext}
        onPrevious={actions.onPrevious}
        // Round management
        onShuffleRound={actions.onShuffleRound}
        onResetToOriginal={actions.onResetToOriginal}
        onStartReviewRound={actions.onStartReviewRound}
        onRestartStudySession={actions.onRestartStudySession}
        // UI state
        shuffled={shuffled}
        showKeyboardHelp={showKeyboardHelp}
        onToggleKeyboardHelp={actions.onToggleKeyboardHelp}
        // Loading and error handling
        controlsLoading={controlsLoading}
        controlsError={controlsError}
        onClearControlsError={actions.onClearControlsError}
      />
    </>
  );
}
