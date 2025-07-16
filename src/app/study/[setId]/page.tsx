"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { redirect, useParams } from "next/navigation";
import { StudyCard } from "@/components/study/StudyCard";
import { StudyProgress } from "@/components/study/StudyProgress";
import { StudyControls } from "@/components/study/StudyControls";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  userId: string;
}

export default function StudyPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const setId = params.setId as string;

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studiedCards, setStudiedCards] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [shuffled, setShuffled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect("/sign-in");
    }
  }, [isLoaded, isSignedIn]);

  // Fetch flashcard set
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchSet = async () => {
      try {
        const response = await fetch(`/api/sets/${setId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch flashcard set");
        }
        const data = await response.json();
        setSet(data);
        setStudyCards(data.cards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSet();
  }, [setId, isSignedIn]);

  // Shuffle cards
  const shuffleCards = () => {
    if (!set) return;

    const shuffledCards = [...set.cards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffledCards);
    setShuffled(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudiedCards([]);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
  };

  // Reset to original order
  const resetCards = () => {
    if (!set) return;

    setStudyCards([...set.cards]);
    setShuffled(false);
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudiedCards([]);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
  };

  // Handle next card
  const handleNext = (gotItRight?: boolean) => {
    if (!studyCards.length) return;

    const currentCard = studyCards[currentIndex];

    // Mark current card as studied and track correct/incorrect
    if (currentCard && !studiedCards.includes(currentCard.id)) {
      setStudiedCards((prev) => [...prev, currentCard.id]);

      if (gotItRight === true) {
        setCorrectAnswers((prev) => [...prev, currentCard.id]);
      } else if (gotItRight === false) {
        setIncorrectAnswers((prev) => [...prev, currentCard.id]);
      }
    }

    // Move to next card
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  // Handle showing answer
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  // Restart study session
  const handleRestart = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setStudiedCards([]);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flashcard set...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!set || !studyCards.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No Cards Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This flashcard set doesn&apos;t contain any cards to study.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = studyCards[currentIndex];
  const isLastCard = currentIndex === studyCards.length - 1;
  const isComplete = studiedCards.length === studyCards.length;

  if (isComplete) {
    const correctCount = correctAnswers.length;
    const incorrectCount = incorrectAnswers.length;
    const skippedCount = studyCards.length - correctCount - incorrectCount;
    const percentage =
      studyCards.length > 0
        ? Math.round((correctCount / studyCards.length) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Study Complete!
          </h1>
          <p className="text-muted-foreground mb-6">
            You&apos;ve completed studying all {studyCards.length} cards in
            &quot;
            {set.name}&quot;.
          </p>

          {/* Results Summary */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-foreground mb-3">Your Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600 dark:text-green-400">
                  ✓ Correct:
                </span>
                <span className="font-medium">{correctCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 dark:text-red-400">
                  ✗ Incorrect:
                </span>
                <span className="font-medium">{incorrectCount}</span>
              </div>
              {skippedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">— Skipped:</span>
                  <span className="font-medium">{skippedCount}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Score:</span>
                  <span
                    className={
                      percentage >= 70
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleRestart} className="w-full">
              Study Again
            </Button>
            <Link href={`/sets/${setId}`}>
              <Button variant="outline" className="w-full">
                View Set Details
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/sets/${setId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Set
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground text-center flex-1">
            Studying: {set.name}
          </h1>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <StudyProgress
            currentIndex={currentIndex}
            totalCards={studyCards.length}
            studiedCards={studiedCards.length}
          />
        </div>

        {/* Study Controls */}
        <div className="mb-6">
          <StudyControls
            shuffled={shuffled}
            onShuffle={shuffleCards}
            onReset={resetCards}
            onRestart={handleRestart}
          />
        </div>

        {/* Study Card */}
        <div className="flex justify-center">
          <StudyCard
            flashcard={currentCard}
            showAnswer={showAnswer}
            onShowAnswer={handleShowAnswer}
            onNext={handleNext}
            isLastCard={isLastCard}
          />
        </div>
      </div>
    </div>
  );
}
