import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardsSessionStorage } from "@/lib/CardsSessionStorage";
import type { ContentAnalysis } from "./useContentAnalysis";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface EditState {
  question: string;
  answer: string;
}

interface ReviewCardsState {
  cards: Flashcard[];
  loading: boolean;
  error: string | null;
  analysis: ContentAnalysis | null;
  sourceText: string;
  editStates: Record<string, EditState>;
  selectedCards: Set<string>;
  bulkOperationLoading: boolean;
  isSaving: boolean;
  saveProgress: number;
}

export function useReviewCards() {
  const router = useRouter();

  const [state, setState] = useState<ReviewCardsState>({
    cards: [],
    loading: true,
    error: null,
    analysis: null,
    sourceText: "",
    editStates: {},
    selectedCards: new Set(),
    bulkOperationLoading: false,
    isSaving: false,
    saveProgress: 0,
  });

  // Load cards from session storage on mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

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
        const cards: Flashcard[] = sessionData.cards.map((card) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          isEditing: false,
          isNew: false,
        }));

        setState((prev) => ({
          ...prev,
          cards,
          analysis: sessionData.analysis,
          sourceText: sessionData.sourceText,
          loading: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load generated cards. Please try generating again.",
        }));
      }
    };

    loadCards();
  }, []);

  // Card editing functions
  const startEditing = useCallback(
    (cardId: string) => {
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
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, isEditing: true } : c
        ),
      }));
    },
    [state.cards]
  );

  const cancelEditing = useCallback((cardId: string) => {
    setState((prev) => {
      const newEditStates = { ...prev.editStates };
      delete newEditStates[cardId];

      return {
        ...prev,
        editStates: newEditStates,
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, isEditing: false } : c
        ),
      };
    });
  }, []);

  const saveCard = useCallback(
    async (cardId: string) => {
      const editState = state.editStates[cardId];
      if (!editState) return;

      // Validate content
      if (!editState.question.trim() || !editState.answer.trim()) {
        setState((prev) => ({
          ...prev,
          error: "Both question and answer are required.",
        }));
        return;
      }

      try {
        // Simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 300));

        setState((prev) => {
          const newEditStates = { ...prev.editStates };
          delete newEditStates[cardId];

          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    question: editState.question.trim(),
                    answer: editState.answer.trim(),
                    isEditing: false,
                    isNew: false,
                  }
                : c
            ),
            editStates: newEditStates,
            error: null,
          };
        });
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to save card. Please try again.",
        }));
      }
    },
    [state.editStates]
  );

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      // Simulate delete operation
      await new Promise((resolve) => setTimeout(resolve, 200));

      setState((prev) => {
        const newEditStates = { ...prev.editStates };
        delete newEditStates[cardId];

        const newSelectedCards = new Set(prev.selectedCards);
        newSelectedCards.delete(cardId);

        return {
          ...prev,
          cards: prev.cards.filter((c) => c.id !== cardId),
          editStates: newEditStates,
          selectedCards: newSelectedCards,
        };
      });
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to delete card. Please try again.",
      }));
    }
  }, []);

  const addNewCard = useCallback(() => {
    const newId = `new-${Date.now()}`;
    const newCard: Flashcard = {
      id: newId,
      question: "",
      answer: "",
      isEditing: true,
      isNew: true,
    };

    setState((prev) => ({
      ...prev,
      cards: [...prev.cards, newCard],
      editStates: {
        ...prev.editStates,
        [newId]: { question: "", answer: "" },
      },
    }));
  }, []);

  // Card improvement using new API
  const improveCard = useCallback(
    async (cardId: string, instruction: string) => {
      const card = state.cards.find((c) => c.id === cardId);
      if (!card) return;

      try {
        setState((prev) => ({
          ...prev,
          bulkOperationLoading: true,
        }));

        const response = await fetch("/api/flashcards/regenerate-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card: {
              question: card.question,
              answer: card.answer,
            },
            instruction,
            context: state.sourceText,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to improve card");
        }

        const { improvedCard } = await response.json();

        setState((prev) => ({
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  question: improvedCard.question,
                  answer: improvedCard.answer,
                }
              : c
          ),
          bulkOperationLoading: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to improve card. Please try again.",
          bulkOperationLoading: false,
        }));
      }
    },
    [state.cards, state.sourceText]
  );

  // Selection functions
  const toggleCardSelection = useCallback((cardId: string) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedCards);
      if (newSelected.has(cardId)) {
        newSelected.delete(cardId);
      } else {
        newSelected.add(cardId);
      }
      return { ...prev, selectedCards: newSelected };
    });
  }, []);

  const selectAllCards = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedCards: new Set(prev.cards.map((c) => c.id)),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedCards: new Set(),
    }));
  }, []);

  // Bulk operations
  const bulkDeleteCards = useCallback(async () => {
    if (state.selectedCards.size === 0) return;

    setState((prev) => ({ ...prev, bulkOperationLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setState((prev) => ({
        ...prev,
        cards: prev.cards.filter((c) => !prev.selectedCards.has(c.id)),
        selectedCards: new Set(),
        bulkOperationLoading: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to delete selected cards. Please try again.",
        bulkOperationLoading: false,
      }));
    }
  }, [state.selectedCards]);

  const bulkImproveCards = useCallback(
    async (instruction: string) => {
      if (state.selectedCards.size === 0) return;

      setState((prev) => ({ ...prev, bulkOperationLoading: true }));

      try {
        const selectedCardData = state.cards
          .filter((c) => state.selectedCards.has(c.id))
          .map((c) => ({ question: c.question, answer: c.answer }));

        const response = await fetch("/api/flashcards/improve-set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cards: selectedCardData,
            instruction,
            context: state.sourceText,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to improve cards");
        }

        const { improvedCards } = await response.json();

        setState((prev) => {
          let improvedIndex = 0;

          return {
            ...prev,
            cards: prev.cards.map((c) => {
              if (
                prev.selectedCards.has(c.id) &&
                improvedIndex < improvedCards.length
              ) {
                const improved = improvedCards[improvedIndex++];
                return {
                  ...c,
                  question: improved.question,
                  answer: improved.answer,
                };
              }
              return c;
            }),
            selectedCards: new Set(),
            bulkOperationLoading: false,
          };
        });
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to improve selected cards. Please try again.",
          bulkOperationLoading: false,
        }));
      }
    },
    [state.selectedCards, state.cards, state.sourceText]
  );

  // Save flashcard set
  const handleSaveSet = useCallback(
    async (setName: string) => {
      setState((prev) => ({ ...prev, isSaving: true, saveProgress: 0 }));

      try {
        // Simulate save progress
        const steps = [25, 50, 75, 100];

        for (const step of steps) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setState((prev) => ({ ...prev, saveProgress: step }));
        }

        // Call API to save the set
        const response = await fetch("/api/sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: setName,
            cards: state.cards.map(({ question, answer }) => ({
              question,
              answer,
            })),
            analysis: state.analysis,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save flashcard set");
        }

        const { setId } = await response.json();

        // Clear session storage
        CardsSessionStorage.clear();

        // Redirect to the new set
        router.push(`/sets/${setId}`);
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to save flashcard set. Please try again.",
          isSaving: false,
          saveProgress: 0,
        }));
      }
    },
    [state.cards, state.analysis, router]
  );

  // Update edit state
  const updateEditState = useCallback(
    (cardId: string, field: "question" | "answer", value: string) => {
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
    },
    []
  );

  // Error handling
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    cards: state.cards,
    loading: state.loading,
    error: state.error,
    analysis: state.analysis,
    selectedCards: state.selectedCards,
    editStates: state.editStates,
    bulkOperationLoading: state.bulkOperationLoading,
    isSaving: state.isSaving,
    saveProgress: state.saveProgress,

    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    improveCard,
    updateEditState,

    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,
    bulkImproveCards,

    // Save operations
    handleSaveSet,

    // Error handling
    clearError,
  };
}
