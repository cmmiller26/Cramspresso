import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";
import { createSet } from "@/lib/api/sets";
import type { ReviewPageState } from "@/lib/types/create";
import type { ReviewFlashcard } from "@/lib/types/flashcards";

/**
 * Main coordinating hook for the review flow
 * Manages state across all review components and coordinates between them
 * This is a foundation hook that will be expanded in Week 3
 */
export function useReviewOrchestrator() {
  const router = useRouter();
  const { setLoading, isLoading } = useLoadingState([
    "save-set",
    "bulk-delete",
    "card-operations",
    "loading-cards",
  ]);
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

  // Load cards from session storage on mount
  useEffect(() => {
    try {
      setLoading("loading-cards", true);
      const sessionData = CardsSessionStorage.load();

      if (
        !sessionData ||
        !sessionData.cards ||
        sessionData.cards.length === 0
      ) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "No flashcards found. Please create flashcards first.",
        }));
        return;
      }

      // Convert session cards to ReviewFlashcard format
      const reviewCards: ReviewFlashcard[] = sessionData.cards.map(
        (card, index) => ({
          id: `card-${index}`,
          question: card.question,
          answer: card.answer,
          isNew: false,
        })
      );

      setState((prev) => ({
        ...prev,
        cards: reviewCards,
        analysis: sessionData.analysis || null,
        sourceText: sessionData.sourceText || "",
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to load cards:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load flashcards from session.",
      }));
    } finally {
      setLoading("loading-cards", false);
    }
  }, [setLoading]);

  // Card management functions
  const handleCardUpdate = async (
    cardId: string,
    updates: Partial<ReviewFlashcard>
  ) => {
    setLoading("card-operations", true);
    try {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      }));
    } catch {
      showError("REFINEMENT_ERROR", "Failed to update card", {
        onRetry: () => handleCardUpdate(cardId, updates),
      });
    } finally {
      setLoading("card-operations", false);
    }
  };

  const handleCardDelete = async (cardId: string) => {
    setLoading("card-operations", true);
    try {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.filter((card) => card.id !== cardId),
        selectedCards: new Set(
          [...prev.selectedCards].filter((id) => id !== cardId)
        ),
        editStates: Object.fromEntries(
          Object.entries(prev.editStates).filter(([id]) => id !== cardId)
        ),
      }));
    } catch {
      showError("REFINEMENT_ERROR", "Failed to delete card", {
        onRetry: () => handleCardDelete(cardId),
      });
    } finally {
      setLoading("card-operations", false);
    }
  };

  const handleBulkDelete = async (cardIds: string[]) => {
    setLoading("bulk-delete", true);
    try {
      setState((prev) => ({
        ...prev,
        cards: prev.cards.filter((card) => !cardIds.includes(card.id)),
        selectedCards: new Set(),
        editStates: Object.fromEntries(
          Object.entries(prev.editStates).filter(
            ([id]) => !cardIds.includes(id)
          )
        ),
      }));
    } catch {
      showError("BULK_ERROR", "Failed to delete selected cards", {
        onRetry: () => handleBulkDelete(cardIds),
      });
    } finally {
      setLoading("bulk-delete", false);
    }
  };

  // Selection management
  const handleToggleSelection = (cardId: string) => {
    setState((prev) => {
      const newSelection = new Set(prev.selectedCards);
      if (newSelection.has(cardId)) {
        newSelection.delete(cardId);
      } else {
        newSelection.add(cardId);
      }
      return { ...prev, selectedCards: newSelection };
    });
  };

  const handleSelectAll = () => {
    setState((prev) => ({
      ...prev,
      selectedCards: new Set(prev.cards.map((card) => card.id)),
    }));
  };

  const handleClearSelection = () => {
    setState((prev) => ({
      ...prev,
      selectedCards: new Set(),
    }));
  };

  // Edit state management
  const handleStartEdit = (cardId: string) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    setState((prev) => ({
      ...prev,
      editStates: {
        ...prev.editStates,
        [cardId]: {
          question: card.question,
          answer: card.answer,
        },
      },
    }));
  };

  const handleCancelEdit = (cardId: string) => {
    setState((prev) => ({
      ...prev,
      editStates: Object.fromEntries(
        Object.entries(prev.editStates).filter(([id]) => id !== cardId)
      ),
    }));
  };

  // Save set function
  const handleSaveSet = async (name: string) => {
    setLoading("save-set", true);
    setState((prev) => ({ ...prev, isSaving: true, saveProgress: 0 }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          saveProgress: Math.min(prev.saveProgress + 10, 90),
        }));
      }, 200);

      // Convert cards to the format expected by the API
      const cardsToSave = state.cards.map((card) => ({
        question: card.question,
        answer: card.answer,
      }));

      const result = await createSet(name, cardsToSave);

      clearInterval(progressInterval);
      setState((prev) => ({ ...prev, saveProgress: 100 }));

      // Clear session storage since we've successfully saved
      CardsSessionStorage.clear();

      // Redirect to the new set
      setTimeout(() => {
        router.push(`/sets/${result.setId}`);
      }, 1000);
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false, saveProgress: 0 }));
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save set";
      showError("REVIEW_PAGE_ERROR", errorMessage, {
        onRetry: () => handleSaveSet(name),
        onGoBack: () => router.push("/create"),
      });
    } finally {
      setLoading("save-set", false);
    }
  };

  return {
    // State
    cards: state.cards,
    analysis: state.analysis,
    sourceText: state.sourceText,
    selectedCards: state.selectedCards,
    editStates: state.editStates,
    loading: state.loading,
    error: state.error,
    isSaving: state.isSaving,
    saveProgress: state.saveProgress,

    // Card operations
    onCardUpdate: handleCardUpdate,
    onCardDelete: handleCardDelete,
    onBulkDelete: handleBulkDelete,

    // Selection operations
    onToggleSelection: handleToggleSelection,
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,

    // Edit operations
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,

    // Save operations
    onSaveSet: handleSaveSet,

    // Loading states
    isLoading: isLoading,

    // Error handling
    clearError,
  };
}
