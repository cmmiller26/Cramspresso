import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";
import { useCardRefinement } from "@/hooks/create/cards/useCardRefinement";
import { useBulkImprovements } from "@/hooks/create/cards/useBulkImprovements";
import { useAISuggestions } from "@/hooks/create/cards/useAISuggestions";
import {
  AISuggestion,
  BulkImprovementType,
  ReviewPageState,
} from "@/lib/types/create";
import { ReviewFlashcard } from "@/lib/types/flashcards";

export function useReviewCards() {
  const router = useRouter();

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

  // Initialize refinement hooks
  const cardRefinement = useCardRefinement();
  const bulkImprovements = useBulkImprovements();
  const aiSuggestions = useAISuggestions(state.cards, state.analysis);

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
        const cards: ReviewFlashcard[] = sessionData.cards.map((card) => ({
          id: card.id || `card-${Date.now()}-${Math.random()}`,
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
    const newCard: ReviewFlashcard = {
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

  // FIXED: Card refinement with proper error handling and logging
  const handleCardRefinement = useCallback(
    async (cardId: string, instruction: string) => {
      console.log("🔍 DEBUG: Starting card refinement", {
        cardId,
        instruction,
      });

      const card = state.cards.find((c) => c.id === cardId);
      if (!card) {
        console.error("❌ DEBUG: Card not found", {
          cardId,
          availableCards: state.cards.map((c) => c.id),
        });
        setState((prev) => ({ ...prev, error: "Card not found" }));
        return;
      }

      console.log("✅ DEBUG: Card found", { card });

      // Validate card data before passing to API
      if (!card.question?.trim() || !card.answer?.trim()) {
        console.error("❌ DEBUG: Invalid card data", { card });
        setState((prev) => ({
          ...prev,
          error: "Card is missing question or answer content",
        }));
        return;
      }

      try {
        console.log("📡 DEBUG: Calling regenerateCard with:", {
          cardId,
          originalCard: { question: card.question, answer: card.answer },
          instruction,
          context: state.sourceText?.substring(0, 100) + "...",
          contentType: state.analysis?.contentType,
        });

        // FIXED: Call with correct signature and parameters
        const improvedCard = await cardRefinement.regenerateCard(
          cardId,
          { question: card.question, answer: card.answer },
          instruction,
          state.sourceText,
          state.analysis?.contentType
        );

        console.log("✅ DEBUG: Card regeneration successful", { improvedCard });

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
          error: null, // Clear any previous errors
        }));
      } catch (error) {
        console.error("❌ DEBUG: Card refinement failed", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to improve card",
        }));
      }
    },
    [state.cards, state.sourceText, state.analysis, cardRefinement]
  );

  // Selection functions
  const toggleCardSelection = useCallback((cardId: string) => {
    console.log("🔍 DEBUG: Toggling card selection", { cardId });

    setState((prev) => {
      const newSelected = new Set(prev.selectedCards);
      const wasSelected = newSelected.has(cardId);

      if (wasSelected) {
        newSelected.delete(cardId);
        console.log("➖ DEBUG: Card deselected", {
          cardId,
          newSize: newSelected.size,
        });
      } else {
        newSelected.add(cardId);
        console.log("➕ DEBUG: Card selected", {
          cardId,
          newSize: newSelected.size,
        });
      }

      console.log("📋 DEBUG: Selection state updated", {
        selectedCards: Array.from(newSelected),
        totalSelected: newSelected.size,
      });

      return { ...prev, selectedCards: newSelected };
    });
  }, []);

  const selectAllCards = useCallback(() => {
    console.log("🔍 DEBUG: Selecting all cards", {
      totalCards: state.cards.length,
    });

    setState((prev) => {
      const allCardIds = prev.cards.map((c) => c.id);
      console.log("✅ DEBUG: All cards selected", { cardIds: allCardIds });

      return {
        ...prev,
        selectedCards: new Set(allCardIds),
      };
    });
  }, [state.cards]);

  const clearSelection = useCallback(() => {
    console.log("🔍 DEBUG: Clearing selection", {
      currentSize: state.selectedCards.size,
    });

    setState((prev) => ({
      ...prev,
      selectedCards: new Set(),
    }));
  }, [state.selectedCards.size]);

  // FIXED: Bulk operations with proper validation and logging
  const handleBulkImprovements = useCallback(
    async (
      improvementType: BulkImprovementType,
      customInstruction?: string,
      targetCardCount?: number
    ) => {
      console.log("🔍 DEBUG: Starting bulk improvements", {
        improvementType,
        selectedCardsSize: state.selectedCards.size,
        selectedCardIds: Array.from(state.selectedCards),
        totalCards: state.cards.length,
        customInstruction,
        targetCardCount,
      });

      // FIXED: Better validation logic
      const isAddMoreCards = improvementType === "add_more_cards";

      if (!isAddMoreCards && state.selectedCards.size === 0) {
        console.error("❌ DEBUG: No cards selected for non-add operation");
        setState((prev) => ({
          ...prev,
          error:
            "Please select cards to improve first. Use the checkboxes next to each card.",
        }));
        return;
      }

      try {
        let selectedCardData;

        if (isAddMoreCards) {
          // For adding cards, use all cards as context
          selectedCardData = state.cards.map((c) => ({
            id: c.id,
            question: c.question,
            answer: c.answer,
          }));
          console.log("📋 DEBUG: Using all cards for add_more_cards", {
            count: selectedCardData.length,
          });
        } else {
          // For other improvements, use selected cards
          selectedCardData = state.cards
            .filter((c) => {
              const isSelected = state.selectedCards.has(c.id);
              console.log(`📝 DEBUG: Card ${c.id} selected: ${isSelected}`);
              return isSelected;
            })
            .map((c) => ({
              id: c.id,
              question: c.question,
              answer: c.answer,
            }));

          console.log("📋 DEBUG: Selected cards for improvement", {
            count: selectedCardData.length,
            cards: selectedCardData.map((c) => ({
              id: c.id,
              questionStart: c.question.substring(0, 30) + "...",
            })),
          });

          // Double-check we have selected cards
          if (selectedCardData.length === 0) {
            console.error(
              "❌ DEBUG: No cards in selectedCardData after filtering"
            );
            setState((prev) => ({
              ...prev,
              error:
                "Selected cards could not be processed. Please try reselecting cards.",
            }));
            return;
          }
        }

        console.log("📡 DEBUG: Calling bulkImprovements.improveCards with:", {
          cardsCount: selectedCardData.length,
          improvementType,
          customInstruction,
          contextLength: state.sourceText?.length || 0,
          contentType: state.analysis?.contentType,
          targetCardCount,
        });

        const improvementResult = await bulkImprovements.improveCards(
          selectedCardData,
          improvementType,
          customInstruction,
          targetCardCount,
          state.sourceText,
          state.analysis?.contentType
        );

        console.log("✅ DEBUG: Bulk improvement successful", {
          improvedCount: improvementResult.improvedCards.length,
          originalCount: selectedCardData.length,
        });

        setState((prev) => {
          let improvedIndex = 0;
          const newCards = [...prev.cards];

          // Handle "add_more_cards" case
          if (
            isAddMoreCards &&
            improvementResult.improvedCards.length > selectedCardData.length
          ) {
            // Add new cards
            const newCardsToAdd = improvementResult.improvedCards.slice(
              selectedCardData.length
            );
            console.log("➕ DEBUG: Adding new cards", {
              count: newCardsToAdd.length,
            });

            newCardsToAdd.forEach((newCard) => {
              newCards.push({
                id: newCard.id || `bulk-new-${Date.now()}-${Math.random()}`,
                question: newCard.question,
                answer: newCard.answer,
                isNew: true,
              });
            });
          }

          // Update existing selected cards (or all cards for add_more_cards)
          const updatedCards = newCards.map((c) => {
            const shouldUpdate = isAddMoreCards
              ? improvedIndex <
                Math.min(
                  improvementResult.improvedCards.length,
                  selectedCardData.length
                )
              : prev.selectedCards.has(c.id) &&
                improvedIndex < improvementResult.improvedCards.length;

            if (shouldUpdate) {
              const improved = improvementResult.improvedCards[improvedIndex++];
              console.log(`🔄 DEBUG: Updating card ${c.id}`, {
                oldQuestion: c.question.substring(0, 30) + "...",
                newQuestion: improved.question.substring(0, 30) + "...",
              });
              return {
                ...c,
                question: improved.question,
                answer: improved.answer,
              };
            }
            return c;
          });

          return {
            ...prev,
            cards: updatedCards,
            selectedCards: new Set(), // Clear selection after operation
            error: null, // Clear any previous errors
          };
        });
      } catch (error) {
        console.error("❌ DEBUG: Bulk improvement failed", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to improve cards",
        }));
      }
    },
    [
      state.selectedCards,
      state.cards,
      state.sourceText,
      state.analysis,
      bulkImprovements,
    ]
  );

  // FIXED: AI suggestions handling with proper state synchronization
  const handleApplySuggestion = useCallback(
    async (suggestion: AISuggestion) => {
      console.log("🔍 DEBUG: Applying AI suggestion", { suggestion });

      try {
        // Mark suggestion as applied immediately
        aiSuggestions.applySuggestion(suggestion.id);

        // Handle different suggestion types
        if (suggestion.instruction === "add_more_cards") {
          console.log("➕ DEBUG: Applying add_more_cards suggestion");
          await handleBulkImprovements(
            "add_more_cards",
            undefined,
            suggestion.targetCardCount
          );
        } else {
          // FIXED: Handle selection logic synchronously without setTimeout
          if (suggestion.requiresSelection && state.selectedCards.size === 0) {
            console.log("📝 DEBUG: Auto-selecting all cards for suggestion");

            // Get all card IDs for selection
            const allCardIds = state.cards.map((c) => c.id);

            // Update state synchronously and then call bulk improvements
            setState((prev) => ({
              ...prev,
              selectedCards: new Set(allCardIds),
            }));

            // FIXED: Call handleBulkImprovements with explicitly selected cards
            // to avoid timing issues with state updates
            console.log(
              "⏳ DEBUG: Applying improvement with auto-selected cards"
            );

            // Create the selected card data directly instead of relying on state
            const selectedCardData = state.cards.map((c) => ({
              id: c.id,
              question: c.question,
              answer: c.answer,
            }));

            console.log(
              "📡 DEBUG: Calling bulkImprovements.improveCards directly"
            );

            const improvementResult = await bulkImprovements.improveCards(
              selectedCardData,
              suggestion.instruction,
              undefined, // customInstruction
              undefined, // targetCardCount
              state.sourceText,
              state.analysis?.contentType
            );

            // Update cards with improvements
            setState((prev) => {
              let improvedIndex = 0;
              const updatedCards = prev.cards.map((c) => {
                if (improvedIndex < improvementResult.improvedCards.length) {
                  const improved =
                    improvementResult.improvedCards[improvedIndex++];
                  console.log(
                    `🔄 DEBUG: Updating card ${c.id} via direct call`
                  );
                  return {
                    ...c,
                    question: improved.question,
                    answer: improved.answer,
                  };
                }
                return c;
              });

              return {
                ...prev,
                cards: updatedCards,
                selectedCards: new Set(), // Clear selection after operation
                error: null,
              };
            });
          } else {
            // Apply to currently selected cards using existing flow
            console.log("📋 DEBUG: Applying to currently selected cards");
            await handleBulkImprovements(suggestion.instruction);
          }
        }
      } catch (error) {
        console.error("❌ DEBUG: Failed to apply suggestion", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to apply suggestion",
        }));
      }
    },
    [
      state.selectedCards,
      state.cards,
      state.sourceText,
      state.analysis,
      handleBulkImprovements,
      aiSuggestions,
      bulkImprovements,
    ]
  );

  // Bulk delete
  const bulkDeleteCards = useCallback(async () => {
    if (state.selectedCards.size === 0) return;

    console.log("🗑️ DEBUG: Bulk deleting cards", {
      count: state.selectedCards.size,
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setState((prev) => ({
        ...prev,
        cards: prev.cards.filter((c) => !prev.selectedCards.has(c.id)),
        selectedCards: new Set(),
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to delete selected cards. Please try again.",
      }));
    }
  }, [state.selectedCards]);

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
    error:
      state.error ||
      cardRefinement.error ||
      bulkImprovements.error ||
      aiSuggestions.error,
    analysis: state.analysis,
    selectedCards: state.selectedCards,
    editStates: state.editStates,
    isSaving: state.isSaving,
    saveProgress: state.saveProgress,

    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    updateEditState,

    // Refinement operations
    handleCardRefinement,
    isCardRegenerating: cardRefinement.isRegenerating,

    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,

    // Bulk improvement operations
    handleBulkImprovements,
    bulkImprovementsState: {
      isImproving: bulkImprovements.isImproving,
      progress: bulkImprovements.progress,
      currentOperation: bulkImprovements.currentOperation,
    },

    // AI suggestions
    aiSuggestions: {
      suggestions: aiSuggestions.suggestions,
      isGenerating: aiSuggestions.isGenerating,
      error: aiSuggestions.error,
      onApplySuggestion: handleApplySuggestion,
      onGenerateMore: aiSuggestions.generateSuggestions, // FIXED: Ensure this is properly connected
      clearError: aiSuggestions.clearError,
    },

    // Save operations
    handleSaveSet,

    // Error handling
    clearError: () => {
      clearError();
      cardRefinement.clearError();
      bulkImprovements.clearError();
      aiSuggestions.clearError();
    },
  };
}
