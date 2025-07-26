import { useState, useCallback } from "react";
import type { GenerationConfig } from "@/components/create/GenerationSettings";

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
    description: "Reading and understanding your material structure",
    duration: 2000,
    endProgress: 20,
  },
  {
    id: "extracting",
    label: "Extracting Key Concepts",
    description: "Identifying important terms, definitions, and relationships",
    duration: 3000,
    endProgress: 45,
  },
  {
    id: "generating",
    label: "Generating Questions",
    description: "Creating targeted questions based on your content",
    duration: 4000,
    endProgress: 75,
  },
  {
    id: "formatting",
    label: "Formatting Cards",
    description: "Finalizing flashcards and preparing for review",
    duration: 1500,
    endProgress: 95,
  },
  {
    id: "complete",
    label: "Complete",
    description: "Your flashcards are ready!",
    duration: 500,
    endProgress: 100,
  },
];

interface GenerationState {
  isGenerating: boolean;
  currentStage: number; // index in GENERATION_STAGES
  progress: number; // 0-100
  error?: string;
  canCancel: boolean;
  estimatedCards: number;
  wordsProcessed: number;
  totalWords: number;
  currentStageDescription: string;
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
    error: undefined,
    canCancel: true,
    estimatedCards: 0,
    wordsProcessed: 0,
    totalWords: 0,
    currentStageDescription: "",
  });

  const animateProgress = useCallback(
    (
      startProgress: number,
      endProgress: number,
      duration: number,
      totalWords: number,
      stageIndex: number
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const progressDiff = endProgress - startProgress;
        const currentStage = GENERATION_STAGES[stageIndex];

        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progressRatio = Math.min(elapsed / duration, 1);

          // Use easing function for more natural progress
          const easedProgress = easeOutCubic(progressRatio);
          const currentProgress = startProgress + progressDiff * easedProgress;

          // Simulate words processed
          const wordsProcessed = Math.floor(
            (totalWords * currentProgress) / 100
          );

          setState((prev) => ({
            ...prev,
            progress: currentProgress,
            wordsProcessed,
            currentStageDescription: currentStage.description,
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

  const runGenerationStages = useCallback(
    async (
      text: string,
      config: GenerationConfig,
      estimatedCards: number,
      totalWords: number
    ) => {
      try {
        // Run through each stage with realistic progress
        for (
          let stageIndex = 0;
          stageIndex < GENERATION_STAGES.length - 1;
          stageIndex++
        ) {
          const stage = GENERATION_STAGES[stageIndex];
          const nextStage = GENERATION_STAGES[stageIndex + 1];

          // Update current stage
          setState((prev) => ({
            ...prev,
            currentStage: stageIndex,
            currentStageDescription: stage.description,
          }));

          // For the generating stage (index 2), make the actual API call
          if (stageIndex === 2) {
            // Start the progress animation
            const progressPromise = animateProgress(
              stage.endProgress,
              nextStage.endProgress,
              stage.duration,
              totalWords,
              stageIndex
            );

            // Make API call concurrently
            const apiPromise = fetch("/api/flashcards/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });

            // Wait for both to complete
            const [, response] = await Promise.all([
              progressPromise,
              apiPromise,
            ]);

            if (!response.ok) {
              throw new Error("Failed to generate flashcards");
            }

            const { cards } = await response.json();

            // Update estimated cards with actual count
            setState((prev) => ({
              ...prev,
              estimatedCards: cards.length,
            }));

            // Continue to next stage
            continue;
          }

          // Animate progress for other stages
          await animateProgress(
            stage.endProgress,
            nextStage.endProgress,
            stage.duration,
            totalWords,
            stageIndex
          );
        }

        // Final completion stage
        setState((prev) => ({
          ...prev,
          currentStage: GENERATION_STAGES.length - 1,
          progress: 100,
          isGenerating: false,
          currentStageDescription:
            GENERATION_STAGES[GENERATION_STAGES.length - 1].description,
        }));

        // Return the generated cards (we'll need to store them during the API call)
        const response = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate flashcards");
        }

        const { cards } = await response.json();
        return cards;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : "Generation failed",
        }));
        throw error;
      }
    },
    [animateProgress]
  );

  const startGeneration = useCallback(
    async (text: string, config: GenerationConfig) => {
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const estimatedCards = Math.max(1, Math.floor(words.length / 50));

      setState({
        isGenerating: true,
        currentStage: 0,
        progress: 0,
        error: undefined,
        canCancel: true,
        estimatedCards,
        wordsProcessed: 0,
        totalWords: words.length,
        currentStageDescription: GENERATION_STAGES[0].description,
      });

      return runGenerationStages(text, config, estimatedCards, words.length);
    },
    [runGenerationStages]
  );

  const cancelGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      canCancel: false,
      error: "Generation cancelled by user",
    }));
  }, []);

  return {
    state,
    startGeneration,
    cancelGeneration,
  };
}
