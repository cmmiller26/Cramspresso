import { useState, useEffect, useCallback, useRef } from "react";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";

// Import new specialized hooks
import { useCardOperations } from "@/hooks/create/cards/useCardOperations";
import { useCardSelection } from "@/hooks/create/cards/useCardSelection";
import { useSetSaving } from "@/hooks/create/review/useSetSaving";

// Import existing domain hooks
import { useCardRefinement } from "@/hooks/create/cards/useCardRefinement";
import { useBulkImprovements } from "@/hooks/create/cards/useBulkImprovements";
import { useAISuggestions } from "@/hooks/create/cards/useAISuggestions";
import { useContentAnalysis } from "@/hooks/create/content/useContentAnalysis";

import type {
  ReviewPageState,
  AISuggestion,
  BulkImprovementType,
  ContentAnalysis,
} from "@/lib/types/create";
import type { ReviewFlashcard, CreateFlashcard } from "@/lib/types/flashcards";

interface UseReviewOrchestratorReturn {
  // State
  cards: ReviewFlashcard[];
  analysis: ContentAnalysis | null;
  sourceText: string;
  selectedCards: Set<string>;
  editStates: { [cardId: string]: { question: string; answer: string } };
  loading: boolean;
  error: string | null;
  isSaving: boolean;
  saveProgress: number;

  // Card operations (for CardEditor, CardList components)
  onCardUpdate: (
    cardId: string,
    updates: Partial<ReviewFlashcard>
  ) => Promise<void>;
  onCardDelete: (cardId: string) => Promise<void>;
  onStartEdit: (cardId: string) => void; // Primary name used by CardList
  onCancelEdit: (cardId: string) => void; // Primary name used by CardList
  onStartEditing: (cardId: string) => void; // Alternative name for compatibility
  onCancelEditing: (cardId: string) => void; // Alternative name for compatibility
  updateEditState: (
    cardId: string,
    field: "question" | "answer",
    value: string
  ) => void;

  // Selection operations (for SelectionControls component)
  onCardSelect: (cardId: string) => void; // Primary name used by CardList
  onToggleSelection: (cardId: string) => void; // Alternative name for compatibility
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: (cardIds: string[]) => Promise<void>;

  // Refinement operations (integrate existing cards/ domain hooks)
  onRefineCard: (cardId: string, instruction: string) => Promise<void>;
  onBulkImprove: (
    improvementType: BulkImprovementType,
    customInstruction?: string,
    targetCardCount?: number
  ) => Promise<void>;

  // AI suggestions (use existing cards/ domain hook)
  suggestions: AISuggestion[];
  onRequestSuggestions: () => Promise<void>;
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  isGeneratingSuggestions: boolean;

  // Content analysis (use existing content/ domain hook)
  onToggleAnalysis: () => void;

  // Save operations (use new review/ domain hook)
  onSaveSet: (name: string) => Promise<void>; // Fixed return type
  saveState: {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
  };

  // Bulk improvements state
  isImproving: boolean;
  improvementProgress: number;
  currentOperation: string;

  // Aggregated loading and error states
  isLoading: boolean;
  clearError: () => void;
}

/**
 * Enhanced main coordinating hook for the review flow
 * Coordinates all specialized hooks from different domains
 * Replaces the monolithic useReviewCards hook while maintaining backward compatibility
 */
export function useReviewOrchestrator(): UseReviewOrchestratorReturn {
  const { setLoading } = useLoadingState(["loading-cards"]);
  const { showError, clearError } = useErrorHandler();

  const [state, setState] = useState<ReviewPageState>({
    cards: [],
    loading: true,
    error: null,
    analysis: null,
    sourceText: "",
    editStates: {},
    selectedCards: new Set(),
    isSaving: false,
    saveProgress: 0,
  });

  // Initialize card operations hook separately
  const cardOperations = useCardOperations([]);

  // Use ref to store stable reference to cardOperations.updateCards
  const updateCardsRef = useRef(cardOperations.updateCards);
  updateCardsRef.current = cardOperations.updateCards;

  // Create stable update function for card selection
  const handleCardsUpdate = useCallback((updatedCards: ReviewFlashcard[]) => {
    setState((prev) => ({ ...prev, cards: updatedCards }));
    updateCardsRef.current(updatedCards);
  }, []); // Empty deps - uses ref

  // Initialize other hooks
  const cardSelection = useCardSelection(state.cards, handleCardsUpdate);
  const setSaving = useSetSaving();

  // Existing domain hooks
  const cardRefinement = useCardRefinement();
  const bulkImprovements = useBulkImprovements();
  const aiSuggestions = useAISuggestions(state.cards, state.analysis);
  const contentAnalysis = useContentAnalysis();

  // Load cards from session storage on mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading("loading-cards", true);
        const sessionData = CardsSessionStorage.load();

        if (!sessionData || !sessionData.cards.length) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              "No generated cards found. Please generate flashcards first.",
          }));
          return;
        }

        // Convert session cards to review format
        const cards: ReviewFlashcard[] = sessionData.cards.map(
          (card, index) => ({
            id: card.id || `card-${index}`,
            question: card.question,
            answer: card.answer,
            isNew: false,
          })
        );

        setState((prev) => ({
          ...prev,
          cards,
          analysis: sessionData.analysis,
          sourceText: sessionData.sourceText,
          loading: false,
        }));

        // Update card operations with loaded cards
        updateCardsRef.current(cards);
      } catch (error) {
        console.error("Failed to load cards:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load generated cards. Please try generating again.",
        }));
      } finally {
        setLoading("loading-cards", false);
      }
    };

    loadCards();
  }, [setLoading]); // No cardOperations dependency needed

  // Cross-domain interaction handlers
  const handleBulkImprove = useCallback(
    async (
      improvementType: BulkImprovementType,
      customInstruction?: string,
      targetCardCount?: number
    ) => {
      const selectedIds = Array.from(cardSelection.selectedCards);

      // Use card selection hook's bulk improve method which integrates with bulk improvements
      await cardSelection.bulkImprove(
        selectedIds,
        improvementType,
        customInstruction,
        targetCardCount,
        state.sourceText,
        state.analysis?.contentType
      );
    },
    [cardSelection, state.sourceText, state.analysis]
  );

  const handleRefineCard = useCallback(
    async (cardId: string, instruction: string) => {
      const card = cardOperations.cards.find((c) => c.id === cardId);
      if (!card) {
        showError("REFINEMENT_ERROR", "Card not found");
        return;
      }

      try {
        const refinedCard = await cardRefinement.regenerateCard(
          cardId,
          { question: card.question, answer: card.answer },
          instruction,
          state.sourceText,
          state.analysis?.contentType
        );

        // Update the card through card operations
        await cardOperations.saveCard(cardId);

        // Also update local state
        setState((prev) => ({
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  question: refinedCard.question,
                  answer: refinedCard.answer,
                }
              : c
          ),
        }));
      } catch (error) {
        console.error("Card refinement failed:", error);
      }
    },
    [
      cardOperations,
      cardRefinement,
      state.sourceText,
      state.analysis,
      showError,
    ]
  );

  const handleApplySuggestion = useCallback(
    async (suggestion: AISuggestion) => {
      console.log("🔍 DEBUG: Applying AI suggestion", { suggestion });

      try {
        // Mark suggestion as applied
        aiSuggestions.applySuggestion(suggestion.id);

        if (suggestion.instruction === "add_more_cards") {
          await handleBulkImprove(
            "add_more_cards",
            undefined,
            suggestion.targetCardCount
          );
        } else {
          // Handle other suggestion types
          if (
            suggestion.requiresSelection &&
            cardSelection.selectedCards.size === 0
          ) {
            // Auto-select all cards for suggestions that require selection
            cardSelection.selectAll();

            // Wait a tick for selection to update, then apply improvement
            setTimeout(() => {
              handleBulkImprove(suggestion.instruction);
            }, 100);
          } else {
            // Apply to currently selected cards
            await handleBulkImprove(suggestion.instruction);
          }
        }
      } catch (error) {
        console.error("Failed to apply suggestion:", error);
        showError("AI_SUGGESTIONS_ERROR", "Failed to apply suggestion");
      }
    },
    [aiSuggestions, handleBulkImprove, cardSelection, showError]
  );

  const handleSaveSet = useCallback(
    async (setName: string): Promise<void> => {
      const cardsToSave: CreateFlashcard[] = cardOperations.cards.map(
        (card) => ({
          question: card.question,
          answer: card.answer,
        })
      );

      // Call setSaving.saveSet but ignore the return value to match interface
      await setSaving.saveSet(setName, cardsToSave);
    },
    [cardOperations.cards, setSaving]
  );

  // Update edit state handler
  const updateEditState = useCallback(
    (cardId: string, field: "question" | "answer", value: string) => {
      // Update both local state and card operations
      setState((prev) => ({
        ...prev,
        editStates: {
          ...prev.editStates,
          [cardId]: {
            ...prev.editStates[cardId],
            [field]: value,
          },
        },
      }));

      cardOperations.updateEditState(cardId, field, value);
    },
    [cardOperations]
  );

  // Provide unified interface for ReviewContainer component (maintaining existing props)
  return {
    // State
    cards: state.cards, // Use state.cards as source of truth
    analysis: state.analysis,
    sourceText: state.sourceText,
    selectedCards: cardSelection.selectedCards,
    editStates: cardOperations.editStates,
    loading: state.loading,
    error: state.error,
    isSaving: setSaving.isSaving,
    saveProgress: setSaving.saveProgress,

    // Card operations (for CardEditor, CardList components)
    onCardUpdate: cardOperations.saveCard,
    onCardDelete: cardOperations.deleteCard,
    onStartEdit: cardOperations.startEditing, // Fixed: was onStartEditing
    onCancelEdit: cardOperations.cancelEditing, // Fixed: was onCancelEditing
    updateEditState,

    // Selection operations (for SelectionControls component)
    onCardSelect: cardSelection.toggleSelection, // Fixed: was onCardSelect
    onSelectAll: cardSelection.selectAll,
    onClearSelection: cardSelection.clearSelection,
    onBulkDelete: cardSelection.bulkDelete,

    // Additional operations that might be expected by components
    onToggleSelection: cardSelection.toggleSelection, // Alternative name
    onStartEditing: cardOperations.startEditing, // Alternative name
    onCancelEditing: cardOperations.cancelEditing, // Alternative name

    // Refinement operations (integrate existing cards/ domain hooks)
    onRefineCard: handleRefineCard,
    onBulkImprove: handleBulkImprove,

    // AI suggestions (use existing cards/ domain hook)
    suggestions: aiSuggestions.suggestions,
    onRequestSuggestions: aiSuggestions.generateSuggestions,
    onApplySuggestion: handleApplySuggestion,
    isGeneratingSuggestions: aiSuggestions.isGenerating,

    // Content analysis (use existing content/ domain hook)
    onToggleAnalysis: contentAnalysis.clearAnalysis, // Simple toggle for now

    // Save operations (use new review/ domain hook)
    onSaveSet: handleSaveSet,
    saveState: {
      isOpen: setSaving.isDialogOpen,
      isLoading: setSaving.isSaving,
      error: setSaving.error,
    },

    // Bulk improvements state
    isImproving: bulkImprovements.isImproving,
    improvementProgress: bulkImprovements.progress || 0,
    currentOperation: bulkImprovements.currentOperation || "Improving cards",

    // Aggregated loading and error states
    isLoading:
      state.loading ||
      cardOperations.isLoading ||
      cardSelection.isLoading ||
      setSaving.isLoading ||
      cardRefinement.error !== null ||
      bulkImprovements.isImproving ||
      aiSuggestions.isGenerating,

    // Error handling
    clearError: () => {
      clearError();
      cardOperations.clearError();
      cardSelection.clearError();
      setSaving.clearError();
      cardRefinement.clearError();
      bulkImprovements.clearError();
      aiSuggestions.clearError();
    },
  };
}
