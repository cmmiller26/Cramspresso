import { useState, useCallback } from "react";
import type { ContentAnalysis } from "./useContentAnalysis";

export interface GeneratedCard {
  id: string;
  question: string;
  answer: string;
}

interface GenerationStage {
  id: string;
  label: string;
  description: string;
  duration: number; // milliseconds
  endProgress: number; // 0-100
}

const GENERATION_STAGES: GenerationStage[] = [
  {
    id: "analyzing",
    label: "Analyzing Content",
    description: "AI is understanding your content structure and key concepts",
    duration: 2000,
    endProgress: 30,
  },
  {
    id: "generating",
    label: "Creating Flashcards",
    description: "Generating targeted questions and answers based on analysis",
    duration: 4000,
    endProgress: 90,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Preparing your flashcards for review",
    duration: 1000,
    endProgress: 100,
  },
];

interface GenerationState {
  isGenerating: boolean;
  currentStage: number;
  progress: number;
  error?: string;
  canCancel: boolean;
  currentStageDescription: string;
  generatedCards: GeneratedCard[];
}

// Easing function for natural progress animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useGenerationProgress() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    currentStage: 0,
    progress: 0,
    canCancel: true,
    currentStageDescription: "",
    generatedCards: [],
  });

  const animateProgress = useCallback(
    (
      startProgress: number,
      endProgress: number,
      duration: number
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const progressDiff = endProgress - startProgress;

        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progressRatio = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutCubic(progressRatio);
          const currentProgress = startProgress + progressDiff * easedProgress;

          setState((prev) => ({
            ...prev,
            progress: currentProgress,
          }));

          if (progressRatio < 1) {
            requestAnimationFrame(updateProgress);
          } else {
            resolve();
          }
        };

        updateProgress();
      });
    },
    []
  );

  const generateFlashcards = useCallback(
    async (
      text: string,
      analysis: ContentAnalysis
    ): Promise<GeneratedCard[]> => {
      setState({
        isGenerating: true,
        currentStage: 0,
        progress: 0,
        canCancel: true,
        currentStageDescription: GENERATION_STAGES[0].description,
        generatedCards: [],
        error: undefined,
      });

      try {
        // Stage 1: Show analysis stage (using existing analysis)
        setState((prev) => ({
          ...prev,
          currentStageDescription: GENERATION_STAGES[0].description,
        }));

        await animateProgress(
          0,
          GENERATION_STAGES[0].endProgress,
          GENERATION_STAGES[0].duration
        );

        // Stage 2: Actually generate cards
        setState((prev) => ({
          ...prev,
          currentStage: 1,
          currentStageDescription: GENERATION_STAGES[1].description,
        }));

        // Start progress animation and API call concurrently
        const progressPromise = animateProgress(
          GENERATION_STAGES[0].endProgress,
          GENERATION_STAGES[1].endProgress,
          GENERATION_STAGES[1].duration
        );

        const apiPromise = fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            analysis, // Pass the analysis to help generation
          }),
        });

        const [, response] = await Promise.all([progressPromise, apiPromise]);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate flashcards");
        }

        interface ApiCardResponse {
          id?: string;
          question: string;
          answer: string;
        }

        const { cards } = await response.json();

        // Convert API response to our format
        const generatedCards: GeneratedCard[] = cards.map(
          (card: ApiCardResponse, index: number) => ({
            id: card.id || `generated-${Date.now()}-${index}`,
            question: card.question,
            answer: card.answer,
          })
        );

        // Stage 3: Finalization
        setState((prev) => ({
          ...prev,
          currentStage: 2,
          currentStageDescription: GENERATION_STAGES[2].description,
          generatedCards,
        }));

        await animateProgress(
          GENERATION_STAGES[1].endProgress,
          GENERATION_STAGES[2].endProgress,
          GENERATION_STAGES[2].duration
        );

        // Complete
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          progress: 100,
        }));

        return generatedCards;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Generation failed";

        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [animateProgress]
  );

  const cancelGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      canCancel: false,
      error: "Generation cancelled by user",
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  return {
    state,
    generateFlashcards,
    cancelGeneration,
    clearError,
  };
}
