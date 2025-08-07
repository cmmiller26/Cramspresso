import { useState, useCallback, useEffect } from "react";
import type { ContentAnalysis } from "@/lib/types/api";

export interface AISuggestion {
  id: string;
  type: "difficulty" | "coverage" | "examples" | "clarity" | "count";
  title: string;
  description: string;
  instruction: string;
  priority: "high" | "medium" | "low";
  applied: boolean;
  // Add additional fields for better integration
  targetCardCount?: number;
  requiresSelection?: boolean;
}

interface AISuggestionsState {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  appliedSuggestions: Set<string>;
  generatedSuggestionTypes: Set<string>; // Track what types we've suggested before
  error: string | null;
}

export function useAISuggestions(
  cards: Array<{ question: string; answer: string }>,
  analysis: ContentAnalysis | null
) {
  const [state, setState] = useState<AISuggestionsState>({
    suggestions: [],
    isGenerating: false,
    appliedSuggestions: new Set(),
    generatedSuggestionTypes: new Set(),
    error: null,
  });

  // FIXED: Enhanced generateSuggestions with variety, clearing, and proper state management
  const generateSuggestions = useCallback(async () => {
    console.log("🔍 DEBUG: Generate suggestions called", {
      cardsCount: cards.length,
      hasAnalysis: !!analysis,
      analysisType: analysis?.contentType,
      currentSuggestionsCount: state.suggestions.length,
      previousTypes: Array.from(state.generatedSuggestionTypes),
    });

    if (!analysis || cards.length === 0) {
      console.log("⚠️ DEBUG: Cannot generate suggestions - missing data", {
        hasAnalysis: !!analysis,
        cardsCount: cards.length,
      });
      setState((prev) => ({
        ...prev,
        error: "Need cards and analysis to generate suggestions",
      }));
      return;
    }

    // FIXED: Clear existing suggestions and set loading state
    setState((prev) => ({
      ...prev,
      suggestions: [], // Clear existing suggestions
      isGenerating: true,
      error: null,
    }));

    try {
      console.log("🤖 DEBUG: Starting AI suggestion generation");

      // Add delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // All possible suggestion configurations
      const allPossibleSuggestions = [
        // Coverage suggestions
        {
          id: "coverage-more-cards",
          type: "coverage" as const,
          title: "Add more cards for complete coverage", 
          description: `Generate additional cards to improve topic coverage`,
          instruction: "add_more_cards",
          priority: "high" as const,
          condition: () => cards.length < 15,
          targetCardCount: cards.length + Math.ceil(cards.length * 0.3),
          requiresSelection: false,
        },
        
        // Difficulty suggestions
        {
          id: "difficulty-harder",
          type: "difficulty" as const,
          title: "Make cards more challenging",
          description: "Add complexity, context, and deeper reasoning to questions",
          instruction: "make_harder",
          priority: "medium" as const,
          condition: () => {
            const avgLength = cards.reduce((sum, card) => sum + card.question.length, 0) / cards.length;
            return avgLength < 80; // Short questions might be too easy
          },
          requiresSelection: true,
        },

        {
          id: "difficulty-easier", 
          type: "difficulty" as const,
          title: "Simplify complex cards",
          description: "Make questions clearer and more accessible",
          instruction: "make_easier",
          priority: "medium" as const,
          condition: () => {
            const avgLength = cards.reduce((sum, card) => sum + card.question.length, 0) / cards.length;
            return avgLength > 150; // Long questions might be confusing
          },
          requiresSelection: true,
        },

        // Examples suggestions
        {
          id: "examples-add",
          type: "examples" as const,
          title: "Add practical examples",
          description: "Include concrete examples and usage scenarios in answers",
          instruction: "add_examples", 
          priority: "medium" as const,
          condition: () => {
            const hasExamples = cards.some(card => 
              card.answer.toLowerCase().includes("example") ||
              card.answer.toLowerCase().includes("for instance") ||
              card.answer.toLowerCase().includes("such as")
            );
            return !hasExamples;
          },
          requiresSelection: true,
        },

        // Context suggestions
        {
          id: "context-add",
          type: "clarity" as const,
          title: "Add context and background", 
          description: "Provide more background information and connections to related concepts",
          instruction: "add_context",
          priority: "medium" as const,
          condition: () => analysis.contentType === "concepts",
          requiresSelection: true,
        },

        // Clarity suggestions
        {
          id: "clarity-improve",
          type: "clarity" as const,
          title: "Improve question clarity",
          description: "Make questions more specific and unambiguous", 
          instruction: "make_clearer",
          priority: "low" as const,
          condition: () => {
            const avgLength = cards.reduce((sum, card) => sum + card.question.length, 0) / cards.length;
            return avgLength > 120;
          },
          requiresSelection: true,
        },

        // Grammar suggestions 
        {
          id: "grammar-fix",
          type: "clarity" as const,
          title: "Polish grammar and formatting",
          description: "Fix grammatical errors and improve language quality",
          instruction: "fix_grammar",
          priority: "low" as const,
          condition: () => {
            return cards.some(card => 
              !card.question.endsWith('?') && !card.question.endsWith('.') ||
              card.answer.startsWith(' ') || card.answer.endsWith(' ') ||
              card.question !== card.question.trim() ||
              card.answer !== card.answer.trim()
            );
          },
          requiresSelection: true,
        },

        // Diversify suggestions
        {
          id: "diversify-questions", 
          type: "clarity" as const,
          title: "Diversify question types",
          description: "Create more varied question formats to avoid repetition",
          instruction: "diversify_questions",
          priority: "medium" as const,
          condition: () => cards.length >= 5,
          requiresSelection: true,
        },
      ];

      // Filter valid suggestions based on conditions and avoid recently generated types
      const validSuggestions = allPossibleSuggestions.filter(config => {
        try {
          return config.condition();
        } catch (error) {
          console.warn(`Suggestion condition failed for ${config.id}:`, error);
          return false;
        }
      });

      console.log("📋 DEBUG: Valid suggestions found", {
        total: validSuggestions.length,
        types: validSuggestions.map(s => s.type),
      });

      // Prioritize suggestions that haven't been generated before
      const freshSuggestions = validSuggestions.filter(config => 
        !state.generatedSuggestionTypes.has(config.id)
      );

      // If all suggestions have been used, reset and use all valid ones
      const suggestionsToUse = freshSuggestions.length > 0 ? freshSuggestions : validSuggestions;

      // Mix priorities and select 2-4 suggestions
      const highPriority = suggestionsToUse.filter(s => s.priority === "high");
      const mediumPriority = suggestionsToUse.filter(s => s.priority === "medium");
      const lowPriority = suggestionsToUse.filter(s => s.priority === "low");

      const selectedSuggestions: typeof allPossibleSuggestions = [];
      
      // Always include at least one high priority if available
      if (highPriority.length > 0) {
        selectedSuggestions.push(highPriority[0]);
      }

      // Add 1-2 medium priority
      const mediumToAdd = mediumPriority.slice(0, 2);
      selectedSuggestions.push(...mediumToAdd);

      // Fill remaining slots with low priority
      const remainingSlots = 4 - selectedSuggestions.length;
      if (remainingSlots > 0 && lowPriority.length > 0) {
        selectedSuggestions.push(...lowPriority.slice(0, remainingSlots));
      }

      // Convert to AISuggestion format
      const finalSuggestions: AISuggestion[] = selectedSuggestions.map(config => ({
        id: config.id,
        type: config.type,
        title: config.title,
        description: config.description,
        instruction: config.instruction,
        priority: config.priority,
        applied: false,
        targetCardCount: config.targetCardCount,
        requiresSelection: config.requiresSelection,
      }));

      console.log("✅ DEBUG: Generated suggestions", {
        count: finalSuggestions.length,
        suggestions: finalSuggestions.map(s => ({
          id: s.id,
          title: s.title,
          priority: s.priority,
        })),
      });

      // FIXED: Update state with new suggestions and track generated types
      setState((prev) => ({
        ...prev,
        suggestions: finalSuggestions,
        generatedSuggestionTypes: new Set([
          ...prev.generatedSuggestionTypes,
          ...finalSuggestions.map(s => s.id),
        ]),
        isGenerating: false,
      }));

    } catch (error) {
      console.error("❌ DEBUG: Failed to generate suggestions", error);

      setState((prev) => ({
        ...prev,
        suggestions: [], // Clear suggestions on error
        isGenerating: false,
        error: error instanceof Error ? error.message : "Failed to generate suggestions",
      }));
    }
  }, [cards, analysis, state.generatedSuggestionTypes, state.suggestions.length]);

  const applySuggestion = useCallback((suggestionId: string) => {
    console.log("🔍 DEBUG: Applying suggestion", { suggestionId });

    setState((prev) => ({
      ...prev,
      appliedSuggestions: new Set([...prev.appliedSuggestions, suggestionId]),
      suggestions: prev.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, applied: true } : s
      ),
    }));
  }, []);

  const clearError = useCallback(() => {
    console.log("🔍 DEBUG: Clearing AI suggestions error");
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // FIXED: Auto-generate suggestions only on initial load (not when suggestions exist)
  useEffect(() => {
    console.log("🔍 DEBUG: useEffect triggered", {
      cardsLength: cards.length,
      hasAnalysis: !!analysis,
      suggestionsLength: state.suggestions.length,
      isGenerating: state.isGenerating,
    });

    // Only auto-generate on initial load when no suggestions exist and not already generating
    if (cards.length > 0 && analysis && state.suggestions.length === 0 && !state.isGenerating) {
      console.log("🤖 DEBUG: Auto-generating initial suggestions");
      generateSuggestions();
    }
  }, [cards.length, analysis, state.suggestions.length, state.isGenerating, generateSuggestions]);

  return {
    ...state,
    generateSuggestions,
    applySuggestion,
    clearError,
  };
}
