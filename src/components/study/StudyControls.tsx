"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, ArrowDownUp, RotateCcw, ChevronLeft } from "lucide-react";

interface StudyControlsProps {
  shuffled: boolean;
  onShuffle: () => void;
  onReset: () => void;
  onRestart: () => void;
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  canGoPrevious: boolean;
}

export function StudyControls({
  shuffled,
  onShuffle,
  onReset,
  onRestart,
  currentIndex,
  totalCards,
  onPrevious,
  canGoPrevious,
}: StudyControlsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Redo
            </Button>

            <span className="text-sm text-muted-foreground mx-2">
              {currentIndex + 1} / {totalCards}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-border" />

          {/* Study Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={shuffled ? onReset : onShuffle}
            className="flex items-center gap-2"
          >
            {shuffled ? (
              <>
                <ArrowDownUp className="h-4 w-4" />
                Original Order
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4" />
                Shuffle Cards
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </Button>
        </div>

        {shuffled && (
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              Cards are shuffled
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
