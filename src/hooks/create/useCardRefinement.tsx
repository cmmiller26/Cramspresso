import { useState, useCallback } from "react";
import * as flashcardsApi from "@/lib/api/flashcards";

export interface RefinementInstruction {
  type:
    | "make_harder"
    | "add_examples"
    | "add_context"
    | "fix_grammar"
    | "make_clearer"
    | "custom";
  label: string;
  description: string;
}

export const REFINEMENT_OPTIONS: RefinementInstruction[] = [
  {
    type: "make_harder",
    label: "Make Harder",
    description: "Increase difficulty with more complex questions",
  },
  {
    type: "add_examples",
    label: "Add Examples",
    description: "Include specific examples in the answer",
  },
  {
    type: "add_context",
    label: "Add Context",
    description: "Provide more background information",
  },
  {
    type: "fix_grammar",
    label: "Fix Grammar",
    description: "Improve grammar and clarity",
  },
  {
    type: "make_clearer",
    label: "Make Clearer",
    description: "Simplify and clarify the language",
  },
  {
    type: "custom",
    label: "Custom...",
    description: "Provide specific instructions",
  },
];

interface CardRefinementState {
  regeneratingCards: Set<string>;
  error: string | null;
}

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
