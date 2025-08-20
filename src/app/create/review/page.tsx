"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ReviewContainer } from "@/components/create/review/ReviewContainer";
import { ArrowLeft } from "lucide-react";
import { useReviewOrchestrator } from "@/hooks/create/review/useReviewOrchestrator";

export default function ReviewPage() {
  const reviewState = useReviewOrchestrator();

  if (reviewState.loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (reviewState.error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-4">
            Failed to load flashcards
          </h2>
          <p className="text-muted-foreground mb-6">{reviewState.error}</p>
          <Button onClick={() => (window.location.href = "/create")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Create
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/create")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Create
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Review & Edit Flashcards
        </h1>
        <p className="text-muted-foreground text-lg">
          Review your generated flashcards and make any adjustments before
          saving
        </p>
      </div>

      {/* Main Review Container */}
      <ReviewContainer {...reviewState} />
    </div>
  );
}
