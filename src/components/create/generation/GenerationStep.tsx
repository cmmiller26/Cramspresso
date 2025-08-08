import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { Brain } from "lucide-react";
import type { GenerationStepProps } from "@/lib/types/components";

export function GenerationStep({
  progress,
  stage,
  error,
  canCancel,
  onCancel,
  onRetry,
  onStartOver,
  className = "",
}: GenerationStepProps) {
  const { showError, clearError } = useErrorHandler();

  // Show error using the standardized error handler
  useEffect(() => {
    if (error) {
      showError("GENERATION_ERROR", error, {
        onRetry,
        onStartOver,
      });
    } else {
      clearError();
    }
  }, [error, showError, clearError, onRetry, onStartOver]);

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary animate-pulse" />
              <h3 className="font-semibold text-foreground">
                Creating Your Flashcards
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </div>
              {canCancel && !error && onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress Display - Hide when there's an error */}
          {!error && (
            <div className="space-y-4">
              <Progress value={progress} className="h-3" />

              {/* Current Stage Display */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <LoadingSpinner size="sm" className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">
                    {stage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AI is analyzing your content and creating targeted
                    flashcards optimized for effective learning
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
