"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { InlineLoading } from "@/components/shared/LoadingSpinner";
import { Shuffle, RotateCcw, ChevronLeft } from "lucide-react";

interface StudyControlsProps {
  shuffled: boolean;
  onShuffle: () => Promise<void> | void;
  onResetToOriginal: () => Promise<void> | void;
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  canGoPrevious: boolean;
  // Loading states
  isLoading?: {
    shuffle: boolean;
    reset: boolean;
  };
  disabled?: boolean;
}

export const StudyControls = memo(function StudyControls({
  shuffled,
  onShuffle,
  onResetToOriginal,
  currentIndex,
  totalCards,
  onPrevious,
  canGoPrevious,
  isLoading = { shuffle: false, reset: false },
  disabled = false,
}: StudyControlsProps) {
  const anyLoading = isLoading.shuffle || isLoading.reset;
  const isDisabled = disabled || anyLoading;

  return (
    <div className="space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg">
        {/* Left: Session Controls */}
        <div className="flex items-center gap-2">
          <LoadingButton
            onClick={onShuffle}
            disabled={isDisabled}
            loading={isLoading.shuffle}
            loadingText="Shuffling..."
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle Cards
          </LoadingButton>

          {shuffled && (
            <LoadingButton
              onClick={onResetToOriginal}
              disabled={isDisabled}
              loading={isLoading.reset}
              loadingText="Resetting..."
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Original
            </LoadingButton>
          )}
        </div>

        {/* Center: Progress Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {currentIndex + 1}
          </span>
          <span>of</span>
          <span className="font-medium text-foreground">{totalCards}</span>
          <span>cards</span>
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onPrevious}
            disabled={!canGoPrevious || isDisabled}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {anyLoading && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground border border-border">
            <InlineLoading
              text={
                isLoading.shuffle
                  ? "Shuffling cards..."
                  : isLoading.reset
                  ? "Resetting to original order..."
                  : "Processing..."
              }
            />
          </div>
        </div>
      )}
    </div>
  );
});
