import { useState, useCallback } from "react";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { useBulkImprovements } from "./useBulkImprovements";
import type { ReviewFlashcard } from "@/lib/types/flashcards";
import type { BulkImprovementType } from "@/lib/types/create";

interface CardSelectionState {
  selectedCards: Set<string>;
  selectionMode: "none" | "some" | "all";
}

interface UseCardSelectionReturn {
  selectedCards: Set<string>;
  selectionMode: "none" | "some" | "all";
  toggleSelection: (cardId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bulkDelete: (cardIds: string[]) => Promise<void>;
  bulkImprove: (
    cardIds: string[],
    improvementType: BulkImprovementType,
    customInstruction?: string,
    targetCardCount?: number,
    context?: string,
    contentType?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Multi-card selection and bulk operations hook
 * Extracted from useReviewCards to provide focused selection management
 * Integrates with existing useBulkImprovements hook from the same domain
 */
export function useCardSelection(
  cards: ReviewFlashcard[],
  onCardsUpdate?: (cards: ReviewFlashcard[]) => void
): UseCardSelectionReturn {
  const { setLoading, isLoading: checkLoading } = useLoadingState([
    "bulk-delete",
    "bulk-select",
  ]);
  const { showError, clearError, hasError } = useErrorHandler();

  // Leverage existing bulk operations hook from same domain
  const bulkImprovements = useBulkImprovements();

  const [state, setState] = useState<CardSelectionState>({
    selectedCards: new Set(),
    selectionMode: "none",
  });

  // Calculate selection mode based on current selection
  const calculateSelectionMode = useCallback(
    (selectedSet: Set<string>, totalCards: number): "none" | "some" | "all" => {
      if (selectedSet.size === 0) return "none";
      if (selectedSet.size === totalCards) return "all";
      return "some";
    },
    []
  );

  const toggleSelection = useCallback(
    (cardId: string): void => {
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

        const newMode = calculateSelectionMode(newSelected, cards.length);

        console.log("📋 DEBUG: Selection state updated", {
          selectedCards: Array.from(newSelected),
          totalSelected: newSelected.size,
          selectionMode: newMode,
        });

        return {
          selectedCards: newSelected,
          selectionMode: newMode,
        };
      });
    },
    [cards.length, calculateSelectionMode]
  );

  const selectAll = useCallback((): void => {
    console.log("🔍 DEBUG: Selecting all cards", { totalCards: cards.length });

    setLoading("bulk-select", true);
    try {
      const allCardIds = cards.map((card) => card.id);

      setState(() => ({
        selectedCards: new Set(allCardIds),
        selectionMode: "all",
      }));

      console.log("✅ DEBUG: All cards selected", { cardIds: allCardIds });
      clearError();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to select all cards";
      showError("BULK_ERROR", errorMessage);
    } finally {
      setLoading("bulk-select", false);
    }
  }, [cards, setLoading, showError, clearError]);

  const clearSelection = useCallback((): void => {
    console.log("🔍 DEBUG: Clearing selection", {
      currentSize: state.selectedCards.size,
    });

    setState({
      selectedCards: new Set(),
      selectionMode: "none",
    });
  }, [state.selectedCards.size]);

  const bulkDelete = useCallback(
    async (cardIds: string[]): Promise<void> => {
      console.log("🗑️ DEBUG: Bulk deleting cards", {
        count: cardIds.length,
        cardIds,
      });

      if (cardIds.length === 0) {
        showError("BULK_ERROR", "No cards selected for deletion");
        return;
      }

      setLoading("bulk-delete", true);
      try {
        // Simulate bulk delete operation
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Update parent cards if callback provided
        if (onCardsUpdate) {
          const updatedCards = cards.filter(
            (card) => !cardIds.includes(card.id)
          );
          onCardsUpdate(updatedCards);
        }

        // Clear selection after successful delete
        clearSelection();
        clearError();

        console.log("✅ DEBUG: Bulk delete successful");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to delete selected cards";
        showError("BULK_ERROR", errorMessage, {
          onRetry: () => bulkDelete(cardIds),
        });
      } finally {
        setLoading("bulk-delete", false);
      }
    },
    [cards, onCardsUpdate, setLoading, showError, clearError, clearSelection]
  );

  const bulkImprove = useCallback(
    async (
      cardIds: string[],
      improvementType: BulkImprovementType,
      customInstruction?: string,
      targetCardCount?: number,
      context?: string,
      contentType?: string
    ): Promise<void> => {
      console.log("🔍 DEBUG: Starting bulk improvements", {
        improvementType,
        selectedCount: cardIds.length,
        selectedCardIds: cardIds,
        customInstruction,
        targetCardCount,
      });

      if (cardIds.length === 0 && improvementType !== "add_more_cards") {
        showError("BULK_ERROR", "No cards selected for improvement");
        return;
      }

      try {
        // Get selected cards data
        const selectedCardData = cards
          .filter((card) => cardIds.includes(card.id))
          .map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
          }));

        console.log("📋 DEBUG: Selected cards for improvement", {
          count: selectedCardData.length,
          cards: selectedCardData.map((c) => ({
            id: c.id,
            questionStart: c.question.substring(0, 30) + "...",
          })),
        });

        // Use existing bulk improvements hook
        const improvementResult = await bulkImprovements.improveCards(
          selectedCardData,
          improvementType,
          customInstruction,
          targetCardCount,
          context,
          contentType
        );

        console.log("✅ DEBUG: Bulk improvement successful", {
          improvedCount: improvementResult.improvedCards.length,
          originalCount: selectedCardData.length,
        });

        // Update parent cards if callback provided
        if (onCardsUpdate) {
          let improvedIndex = 0;
          const newCards = [...cards];

          // Handle "add_more_cards" case
          if (
            improvementType === "add_more_cards" &&
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

          // Update existing selected cards
          const updatedCards = newCards.map((card) => {
            const shouldUpdate =
              cardIds.includes(card.id) &&
              improvedIndex < improvementResult.improvedCards.length;

            if (shouldUpdate) {
              const improved = improvementResult.improvedCards[improvedIndex++];
              console.log(`🔄 DEBUG: Updating card ${card.id}`, {
                oldQuestion: card.question.substring(0, 30) + "...",
                newQuestion: improved.question.substring(0, 30) + "...",
              });
              return {
                ...card,
                question: improved.question,
                answer: improved.answer,
              };
            }
            return card;
          });

          onCardsUpdate(updatedCards);
        }

        // Clear selection after successful operation
        clearSelection();
        clearError();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to improve cards";
        showError("BULK_ERROR", errorMessage, {
          onRetry: () =>
            bulkImprove(
              cardIds,
              improvementType,
              customInstruction,
              targetCardCount,
              context,
              contentType
            ),
        });
      }
    },
    [
      cards,
      onCardsUpdate,
      bulkImprovements,
      showError,
      clearError,
      clearSelection,
    ]
  );

  return {
    selectedCards: state.selectedCards,
    selectionMode: state.selectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkImprove,
    isLoading:
      checkLoading("bulk-delete") ||
      checkLoading("bulk-select") ||
      bulkImprovements.isImproving,
    error: hasError ? "Selection operation failed" : bulkImprovements.error,
    clearError: () => {
      clearError();
      bulkImprovements.clearError();
    },
  };
}
