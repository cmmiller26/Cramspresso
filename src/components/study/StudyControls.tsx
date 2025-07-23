"use client";

import { Button } from "@/components/ui/button";
import { Shuffle, RotateCcw, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function StudyControls({
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
          <Button
            onClick={onShuffle}
            disabled={isDisabled}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isLoading.shuffle ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            {isLoading.shuffle ? "Shuffling..." : "Shuffle Cards"}
          </Button>

          {shuffled && (
            <Button
              onClick={onResetToOriginal}
              disabled={isDisabled}
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2 text-destructive hover:text-destructive",
                isDisabled && "opacity-50"
              )}
            >
              {isLoading.reset ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {isLoading.reset ? "Resetting..." : "Reset to Original"}
            </Button>
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

      {/* Loading State Indicator */}
      {anyLoading && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              {isLoading.shuffle && "Shuffling cards..."}
              {isLoading.reset && "Resetting progress..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
