import { useState, useCallback } from "react";
import * as flashcardsApi from "@/lib/api/flashcards";
import {
  BULK_IMPROVEMENT_OPTIONS,
  BulkImprovementResult,
  BulkImprovementState,
  BulkImprovementType,
} from "@/lib/types/create";
import { Flashcard } from "@/lib/types/flashcards";

export function useBulkImprovements() {
  const [state, setState] = useState<BulkImprovementState>({
    isImproving: false,
    progress: 0,
    currentOperation: "",
    error: null,
  });

  const improveCards = useCallback(
    async (
      selectedCards: Array<Flashcard>,
      improvementType: BulkImprovementType,
      customInstruction?: string,
      targetCardCount?: number,
      context?: string,
      contentType?: string
    ): Promise<BulkImprovementResult> => {
      setState({
        isImproving: true,
        progress: 0,
        currentOperation: `Applying ${
          BULK_IMPROVEMENT_OPTIONS.find((opt) => opt.type === improvementType)
            ?.label || improvementType
        }...`,
        error: null,
      });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 15, 85),
          }));
        }, 500);

        // Use centralized API function
        const improvedCards = await flashcardsApi.improveCardSet({
          selectedCards,
          improvementType,
          customInstruction,
          context,
          contentType,
          targetCardCount,
        });

        clearInterval(progressInterval);

        setState({
          isImproving: false,
          progress: 100,
          currentOperation: "Complete",
          error: null,
        });

        return improvedCards;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to improve cards";

        setState({
          isImproving: false,
          progress: 0,
          currentOperation: "",
          error: errorMessage,
        });

        throw error;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    improveCards,
    clearError,
  };
}
