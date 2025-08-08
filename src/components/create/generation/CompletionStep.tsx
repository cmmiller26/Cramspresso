import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CheckCircle, RotateCcw } from "lucide-react";
import type { CompletionStepProps } from "@/lib/types/components";

export function CompletionStep({
  cardCount,
  contentType,
  onRedirect,
  onCreateAnother,
  autoRedirect = true,
  redirectDelay = 2000,
  className = "",
}: CompletionStepProps) {
  React.useEffect(() => {
    if (autoRedirect && onRedirect) {
      const timer = setTimeout(() => {
        onRedirect();
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [autoRedirect, onRedirect, redirectDelay]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-green-800 dark:text-green-200">
            🎉 Flashcards Generated Successfully!
          </CardTitle>
          <p className="text-green-600 dark:text-green-400">
            {cardCount} flashcard{cardCount !== 1 ? "s" : ""} created and ready
            for review
          </p>
          {contentType && (
            <p className="text-green-500 dark:text-green-500 text-sm">
              Optimized for {contentType} content
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {autoRedirect ? (
            <LoadingSpinner size="sm" text="Redirecting to review..." />
          ) : (
            <div className="flex justify-center gap-3">
              {onRedirect && (
                <Button onClick={onRedirect} className="min-w-[120px]">
                  Review Cards
                </Button>
              )}
              {onCreateAnother && (
                <Button
                  variant="outline"
                  onClick={onCreateAnother}
                  className="min-w-[120px]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
