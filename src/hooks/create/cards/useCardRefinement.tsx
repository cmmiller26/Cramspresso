import { useState, useCallback } from "react";
import * as flashcardsApi from "@/lib/api/flashcards";
import type { CardRefinementState } from "@/lib/types/create";

export function useCardRefinement() {
  const [state, setState] = useState<CardRefinementState>({
    regeneratingCards: new Set(),
    error: null,
  });

  const regenerateCard = useCallback(
    async (
      cardId: string,
      originalCard: { question: string; answer: string },
      instruction: string,
      context?: string,
      contentType?: string
    ): Promise<{ question: string; answer: string }> => {
      // Validate inputs
      if (!originalCard?.question?.trim() || !originalCard?.answer?.trim()) {
        throw new Error(
          "Both question and answer are required for regeneration"
        );
      }

      if (!instruction?.trim()) {
        throw new Error("Improvement instruction is required");
      }

      setState((prev) => ({
        ...prev,
        regeneratingCards: new Set([...prev.regeneratingCards, cardId]),
        error: null,
      }));

      try {
        // Use the fixed API function with correct signature
        const improvedCard = await flashcardsApi.regenerateCard(
          originalCard,
          instruction,
          context,
          contentType
        );

        setState((prev) => {
          const newRegenerating = new Set(prev.regeneratingCards);
          newRegenerating.delete(cardId);
          return {
            ...prev,
            regeneratingCards: newRegenerating,
          };
        });

        return improvedCard;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to regenerate card";

        setState((prev) => {
          const newRegenerating = new Set(prev.regeneratingCards);
          newRegenerating.delete(cardId);
          return {
            ...prev,
            regeneratingCards: newRegenerating,
            error: errorMessage,
          };
        });

        throw error;
      }
    },
    []
  );

  const isRegenerating = useCallback(
    (cardId: string): boolean => {
      return state.regeneratingCards.has(cardId);
    },
    [state.regeneratingCards]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    regenerateCard,
    isRegenerating,
    error: state.error,
    clearError,
  };
}
