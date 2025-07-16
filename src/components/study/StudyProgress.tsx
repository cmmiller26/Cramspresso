"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface StudyProgressProps {
  currentIndex: number;
  totalCards: number;
  studiedCards: number;
}

export function StudyProgress({
  currentIndex,
  totalCards,
  studiedCards,
}: StudyProgressProps) {
  const progressPercentage = (currentIndex / totalCards) * 100;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Progress text */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              Card {currentIndex + 1} of {totalCards}
            </span>
            <span className="text-sm text-muted-foreground">
              {studiedCards} completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress
              value={progressPercentage}
              className="h-2"
              aria-label={`Progress: ${
                currentIndex + 1
              } of ${totalCards} cards`}
            />

            {/* Progress stats */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>{totalCards - studiedCards} remaining</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
