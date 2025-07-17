"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Forward } from "lucide-react";

interface StudyCardProps {
  flashcard: {
    id: string;
    question: string;
    answer: string;
  };
  showAnswer: boolean;
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  isLastCard: boolean;
  feedback: "correct" | "incorrect" | "skipped" | null;
  isTransitioning: boolean;
}

export function StudyCard({
  flashcard,
  showAnswer,
  onShowAnswer,
  onNext,
  isLastCard,
  feedback,
  isTransitioning,
}: StudyCardProps) {
  const flipCard = () => {
    if (!showAnswer && !isTransitioning) {
      onShowAnswer();
    }
  };

  const getFeedbackColors = () => {
    switch (feedback) {
      case "correct":
        return "bg-green-500/20 border-green-500/50";
      case "incorrect":
        return "bg-red-500/20 border-red-500/50";
      case "skipped":
        return "bg-gray-500/20 border-gray-500/50";
      default:
        return "";
    }
  };

  const getFeedbackIcon = () => {
    switch (feedback) {
      case "correct":
        return <Check className="h-16 w-16 text-green-500" />;
      case "incorrect":
        return <X className="h-16 w-16 text-red-500" />;
      case "skipped":
        return <Forward className="h-16 w-16 text-gray-500" />;
      default:
        return null;
    }
  };

  const getFeedbackText = () => {
    switch (feedback) {
      case "correct":
        return "Correct!";
      case "incorrect":
        return "Incorrect";
      case "skipped":
        return "Skipped";
      default:
        return "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard Container - 3D Flip Animation */}
      <div className="h-[400px] relative mb-6">
        <div
          className="w-full h-full cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={flipCard}
        >
          <div
            className="relative w-full h-full transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: "preserve-3d",
              transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Question Side */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              <div
                className={`bg-card border border-border rounded-lg shadow-lg p-8 h-full flex flex-col justify-center items-center text-center hover:shadow-xl transition-all duration-300 ${
                  feedback ? getFeedbackColors() : ""
                }`}
              >
                {feedback && !showAnswer ? (
                  // Show feedback overlay on question side
                  <div className="flex flex-col items-center justify-center">
                    {getFeedbackIcon()}
                    <p className="text-2xl font-semibold mt-4">
                      {getFeedbackText()}
                    </p>
                  </div>
                ) : (
                  // Normal question display
                  <>
                    <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                      Question
                    </p>
                    <p className="text-2xl text-foreground leading-relaxed">
                      {flashcard.question}
                    </p>
                    <p className="text-sm text-muted-foreground mt-6 opacity-70">
                      Click to reveal answer
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Answer Side */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div
                className={`bg-primary/5 border border-border rounded-lg shadow-lg p-8 h-full flex flex-col justify-center items-center text-center hover:shadow-xl transition-all duration-300 ${
                  feedback ? getFeedbackColors() : ""
                }`}
              >
                {feedback ? (
                  // Show feedback overlay on answer side
                  <div className="flex flex-col items-center justify-center">
                    {getFeedbackIcon()}
                    <p className="text-2xl font-semibold mt-4">
                      {getFeedbackText()}
                    </p>
                  </div>
                ) : (
                  // Normal answer display
                  <>
                    <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Question
                    </p>
                    <p className="text-lg text-muted-foreground mb-4">
                      {flashcard.question}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                      Answer
                    </p>
                    <p className="text-2xl text-foreground leading-relaxed">
                      {flashcard.answer}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Shows different content based on showAnswer */}
      <div className="h-[120px] flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center">
            {!showAnswer ? (
              // BEFORE showing answer - Show Skip button
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the card to see the answer
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onNext()}
                    disabled={isTransitioning}
                    className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 dark:border-gray-800 dark:text-gray-300 disabled:opacity-50"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              // AFTER showing answer - Show Yes/No buttons
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isLastCard
                    ? "Final card - Did you get it right?"
                    : "Did you get it right?"}
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onNext(false)}
                    disabled={isTransitioning}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-300 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    No
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onNext(true)}
                    disabled={isTransitioning}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Yes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
