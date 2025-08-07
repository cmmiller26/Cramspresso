import { useState, useCallback } from "react";
import * as flashcardsApi from "@/lib/api/flashcards";

export interface BulkImprovementOption {
  type:
    | "make_harder"
    | "make_easier"
    | "add_examples"
    | "add_context"
    | "diversify_questions"
    | "improve_clarity"
    | "add_more_cards"
    | "fix_grammar"
    | "custom";
  label: string;
  description: string;
  requiresTargetCount?: boolean;
}

export const BULK_IMPROVEMENT_OPTIONS: BulkImprovementOption[] = [
  {
    type: "make_harder",
    label: "Make All Harder",
    description: "Increase difficulty across all selected cards",
  },
  {
    type: "make_easier",
    label: "Make Easier",
    description: "Simplify questions for better comprehension",
  },
  {
    type: "add_examples",
    label: "Add Examples",
    description: "Include examples in answers where helpful",
  },
  {
    type: "add_context",
    label: "Add Context",
    description: "Provide more background information",
  },
  {
    type: "diversify_questions",
    label: "Diversify Questions",
    description: "Create more varied question types",
  },
  {
    type: "improve_clarity",
    label: "Improve Clarity",
    description: "Make questions and answers clearer",
  },
  {
    type: "add_more_cards",
    label: "Add More Cards",
    description: "Generate additional cards for better coverage",
    requiresTargetCount: true,
  },
  {
    type: "fix_grammar",
    label: "Fix Grammar",
    description: "Correct grammar and improve language",
  },
  {
    type: "custom",
    label: "Custom Instruction",
    description: "Provide specific improvement instructions",
  },
];

interface BulkImprovementState {
  isImproving: boolean;
  progress: number;
  currentOperation: string;
  error: string | null;
}

export function useBulkImprovements() {
  const [state, setState] = useState<BulkImprovementState>({
    isImproving: false,
    progress: 0,
    currentOperation: "",
    error: null,
  });

  const improveCards = useCallback(
    async (
      cards: Array<{ id?: string; question: string; answer: string }>,
      improvement: string,
      customInstruction?: string,
      context?: string,
      contentType?: string,
      targetCardCount?: number
    ): Promise<
      Array<{ id?: string; question: string; answer: string; isNew?: boolean }>
    > => {
      setState({
        isImproving: true,
        progress: 0,
        currentOperation: `Applying ${
          BULK_IMPROVEMENT_OPTIONS.find((opt) => opt.type === improvement)
            ?.label || improvement
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
          cards,
          improvement,
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
