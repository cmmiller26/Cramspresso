"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Timer } from "lucide-react";
import type { StudySession, StudyRound } from "@/lib/types/flashcards";

interface StudyTimerProps {
  studySession: StudySession;
  currentRound: StudyRound;
}

export function StudyTimer({ studySession, currentRound }: StudyTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Calculate session duration (total time studying)
  const sessionElapsed = Math.floor(
    (currentTime.getTime() - studySession.startTime.getTime()) / 1000
  );

  // Calculate current round duration
  const roundElapsed = Math.floor(
    (currentTime.getTime() - currentRound.startTime.getTime()) / 1000
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Current round time */}
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Round Time</div>
              <div className="text-xl font-mono font-semibold text-foreground">
                {formatTime(roundElapsed)}
              </div>
            </div>
          </div>

          {/* Session total time */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Total Session</div>
              <div className="text-sm font-mono font-medium text-muted-foreground">
                {formatTime(sessionElapsed)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
