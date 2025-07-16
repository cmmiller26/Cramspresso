"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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
}

export function StudyCard({
  flashcard,
  showAnswer,
  onShowAnswer,
  onNext,
  isLastCard,
}: StudyCardProps) {
  const flipCard = () => {
    if (!showAnswer) {
      onShowAnswer();
    }
  };

  const handleNext = (gotItRight?: boolean) => {
    onNext(gotItRight);
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
              <div className="bg-card border border-border rounded-lg shadow-lg p-8 h-full flex flex-col justify-center items-center text-center hover:shadow-xl transition-shadow">
                <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Question
                </p>
                <p className="text-2xl text-foreground leading-relaxed">
                  {flashcard.question}
                </p>
                <p className="text-sm text-muted-foreground mt-6 opacity-70">
                  Click to reveal answer
                </p>
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
              <div className="bg-primary/5 border border-border rounded-lg shadow-lg p-8 h-full flex flex-col justify-center items-center text-center hover:shadow-xl transition-shadow">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed position to prevent layout shift */}
      <div className="h-[80px] flex items-center justify-center">
        {showAnswer && (
          <div className="w-full max-w-md mx-auto">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {isLastCard
                  ? "Final card - Did you get it right?"
                  : "Did you get it right?"}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleNext(false)}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                >
                  <X className="h-4 w-4" />
                  Incorrect
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNext(true)}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300"
                >
                  <Check className="h-4 w-4" />
                  Correct
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
