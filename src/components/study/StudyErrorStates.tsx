"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StudyErrorStateProps {
  error: string;
}

export function StudyErrorState({ error }: StudyErrorStateProps) {
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

export function StudyNoCardsState() {
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
