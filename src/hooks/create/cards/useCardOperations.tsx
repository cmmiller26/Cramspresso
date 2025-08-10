import { useState, useCallback } from "react";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import type { CardEditState } from "@/lib/types/create";
import type { ReviewFlashcard, CreateFlashcard } from "@/lib/types/flashcards";

interface CardOperationsState {
  cards: ReviewFlashcard[];
  editStates: Map<string, CardEditState>;
}

interface UseCardOperationsReturn {
  cards: ReviewFlashcard[];
  editStates: { [cardId: string]: CardEditState }; // Changed to object for component compatibility
  saveCard: (cardId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addCard: (card: CreateFlashcard) => Promise<void>;
  startEditing: (cardId: string) => void;
  cancelEditing: (cardId: string) => void;
  updateEditState: (
    cardId: string,
    field: "question" | "answer",
    value: string
  ) => void;
  updateCards: (cards: ReviewFlashcard[]) => void; // Expose update function properly
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Core card CRUD operations hook
 * Extracted from useReviewCards to provide focused card management functionality
 * Handles individual card operations with proper error handling and loading states
 */
export function useCardOperations(
  initialCards: ReviewFlashcard[] = []
): UseCardOperationsReturn {
  const { setLoading, isLoading: checkLoading } = useLoadingState([
    "save-card",
    "delete-card",
    "add-card",
  ]);
  const { showError, clearError, hasError } = useErrorHandler();

  const [state, setState] = useState<CardOperationsState>({
    cards: initialCards,
    editStates: new Map(),
  });

  // Convert Map to object for compatibility with existing components
  const editStatesObject = Object.fromEntries(state.editStates);

  const saveCard = useCallback(
    async (cardId: string): Promise<void> => {
      const editState = state.editStates.get(cardId);
      if (!editState) {
        showError("REFINEMENT_ERROR", "No edit state found for card");
        return;
      }

      // Validate content
      if (!editState.question.trim() || !editState.answer.trim()) {
        showError("REFINEMENT_ERROR", "Both question and answer are required");
        return;
      }

      setLoading("save-card", true);
      try {
        // For review cards (during creation), we simulate the save
        // In a real app with existing sets, we would call the API with setId
        await new Promise((resolve) => setTimeout(resolve, 300));

        setState((prev) => {
          const newEditStates = new Map(prev.editStates);
          newEditStates.delete(cardId);

          return {
            ...prev,
            cards: prev.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    question: editState.question.trim(),
                    answer: editState.answer.trim(),
                    isNew: false,
                  }
                : card
            ),
            editStates: newEditStates,
          };
        });

        clearError();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save card";
        showError("REFINEMENT_ERROR", errorMessage, {
          onRetry: () => saveCard(cardId),
        });
      } finally {
        setLoading("save-card", false);
      }
    },
    [state.editStates, setLoading, showError, clearError]
  );

  const deleteCardOperation = useCallback(
    async (cardId: string): Promise<void> => {
      setLoading("delete-card", true);
      try {
        // For review cards (during creation), we simulate the delete
        // In a real app with existing sets, we would call the API with setId
        await new Promise((resolve) => setTimeout(resolve, 200));

        setState((prev) => {
          const newEditStates = new Map(prev.editStates);
          newEditStates.delete(cardId);

          return {
            ...prev,
            cards: prev.cards.filter((card) => card.id !== cardId),
            editStates: newEditStates,
          };
        });

        clearError();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete card";
        showError("REFINEMENT_ERROR", errorMessage, {
          onRetry: () => deleteCardOperation(cardId),
        });
      } finally {
        setLoading("delete-card", false);
      }
    },
    [setLoading, showError, clearError]
  );

  const addCard = useCallback(
    async (card: CreateFlashcard): Promise<void> => {
      setLoading("add-card", true);
      try {
        // Generate unique ID for new card
        const newId = `new-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newCard: ReviewFlashcard = {
          id: newId,
          question: card.question,
          answer: card.answer,
          isNew: true,
        };

        setState((prev) => ({
          ...prev,
          cards: [...prev.cards, newCard],
        }));

        clearError();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add card";
        showError("REFINEMENT_ERROR", errorMessage, {
          onRetry: () => addCard(card),
        });
      } finally {
        setLoading("add-card", false);
      }
    },
    [setLoading, showError, clearError]
  );

  const startEditing = useCallback(
    (cardId: string): void => {
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) {
        showError("REFINEMENT_ERROR", "Card not found");
        return;
      }

      setState((prev) => {
        const newEditStates = new Map(prev.editStates);
        newEditStates.set(cardId, {
          question: card.question,
          answer: card.answer,
        });

        return {
          ...prev,
          editStates: newEditStates,
        };
      });
    },
    [state.cards, showError]
  );

  const cancelEditing = useCallback((cardId: string): void => {
    setState((prev) => {
      const newEditStates = new Map(prev.editStates);
      newEditStates.delete(cardId);

      return {
        ...prev,
        editStates: newEditStates,
      };
    });
  }, []);

  const updateEditState = useCallback(
    (cardId: string, field: "question" | "answer", value: string): void => {
      setState((prev) => {
        const newEditStates = new Map(prev.editStates);
        const currentEditState = newEditStates.get(cardId);

        if (currentEditState) {
          newEditStates.set(cardId, {
            ...currentEditState,
            [field]: value,
          });
        }

        return {
          ...prev,
          editStates: newEditStates,
        };
      });
    },
    []
  );

  // Properly expose update function for parent hooks to manage cards
  const updateCards = useCallback((newCards: ReviewFlashcard[]): void => {
    setState((prev) => ({
      ...prev,
      cards: newCards,
    }));
  }, []); // Empty deps - this function should be stable

  return {
    cards: state.cards,
    editStates: editStatesObject, // Convert Map to object for component compatibility
    saveCard,
    deleteCard: deleteCardOperation,
    addCard,
    startEditing,
    cancelEditing,
    updateEditState,
    updateCards, // Expose update function properly
    isLoading:
      checkLoading("save-card") ||
      checkLoading("delete-card") ||
      checkLoading("add-card"),
    error: hasError ? "Card operation failed" : null,
    clearError,
  };
}
