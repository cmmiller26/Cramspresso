"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SampleCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  const sampleCards = [
    {
      question: "What is the primary function of mitochondria in cells?",
      answer:
        "Mitochondria are the powerhouses of the cell, responsible for producing ATP (energy) through cellular respiration.",
    },
    {
      question: "Define photosynthesis and its main equation.",
      answer:
        "Photosynthesis is the process by which plants convert light energy into chemical energy. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
    },
    {
      question: "What are the three branches of the U.S. government?",
      answer:
        "The three branches are: Legislative (Congress), Executive (President), and Judicial (Supreme Court), designed to provide checks and balances.",
    },
  ];

  const [currentCard, setCurrentCard] = useState(0);
  const card = sampleCards[currentCard];

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % sampleCards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard(
      (prev) => (prev - 1 + sampleCards.length) % sampleCards.length
    );
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <section className="py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Try out a sample flashcard to see how Cramspresso works
          </p>
        </div>

        {/* Card Navigation Container */}
        <div className="flex items-center gap-4 mb-6">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous card</span>
          </Button>

          {/* Flashcard Container - 3D Flip Animation */}
          <div className="flex-1 h-[300px] relative">
            <div
              className="w-full h-full cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={flipCard}
            >
              <div
                className="relative w-full h-full transition-transform duration-700 ease-in-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
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
                    <p className="text-xl text-foreground leading-relaxed">
                      {card.question}
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
                    <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                      Answer
                    </p>
                    <p className="text-xl text-foreground leading-relaxed">
                      {card.answer}
                    </p>
                    <p className="text-sm text-muted-foreground mt-6 opacity-70">
                      Click to show question
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            className="flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next card</span>
          </Button>
        </div>

        {/* Card Counter */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Card {currentCard + 1} of {sampleCards.length}
          </p>
        </div>
      </div>
    </section>
  );
}
