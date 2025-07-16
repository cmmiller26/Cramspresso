"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, ArrowDownUp, RotateCcw } from "lucide-react";

interface StudyControlsProps {
  shuffled: boolean;
  onShuffle: () => void;
  onReset: () => void;
  onRestart: () => void;
}

export function StudyControls({
  shuffled,
  onShuffle,
  onReset,
  onRestart,
}: StudyControlsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 justify-center">
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
