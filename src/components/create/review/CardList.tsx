import React from "react";
import { CardEditor } from "./CardEditor";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { EditStatesMap } from "@/lib/types/create";
import type { ReviewFlashcard } from "@/lib/types/flashcards";

interface CardListProps {
  cards: ReviewFlashcard[];
  selectedCards: Set<string>;
  editStates: EditStatesMap;
  onCardUpdate: (
    cardId: string,
    updates: Partial<ReviewFlashcard>
  ) => Promise<void>;
  onCardDelete: (cardId: string) => Promise<void>;
  onCardSelect: (cardId: string) => void;
  onStartEdit: (cardId: string) => void;
  onCancelEdit: (cardId: string) => void;
  className?: string;
}

export const CardList = React.memo(function CardList({
  cards,
  selectedCards,
  editStates,
  onCardUpdate,
  onCardDelete,
  onCardSelect,
  onStartEdit,
  onCancelEdit,
  className = "",
}: CardListProps) {
  const [loadingCards, setLoadingCards] = React.useState<Set<string>>(
    new Set()
  );

  const handleCardUpdate = async (
    cardId: string,
    updates: Partial<ReviewFlashcard>
  ) => {
    setLoadingCards((prev) => new Set([...prev, cardId]));
    try {
      await onCardUpdate(cardId, updates);
    } finally {
      setLoadingCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };

  const handleCardDelete = async (cardId: string) => {
    setLoadingCards((prev) => new Set([...prev, cardId]));
    try {
      await onCardDelete(cardId);
    } catch (error) {
      setLoadingCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      throw error;
    }
  };

  const handleUpdateField = (
    cardId: string,
    field: "question" | "answer",
    value: string
  ) => {
    // This would typically be handled by a parent hook that manages edit states
    // For now, we'll assume the parent manages this through editStates
    console.log(`Update ${field} for card ${cardId}:`, value);
  };

  const handleSaveCard = async (cardId: string) => {
    const editState = editStates[cardId];
    if (!editState) return;

    await handleCardUpdate(cardId, {
      question: editState.question,
      answer: editState.answer,
    });

    onCancelEdit(cardId); // Exit edit mode after save
  };

  if (cards.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-muted-foreground">
          <p className="text-lg font-medium mb-2">No flashcards yet</p>
          <p className="text-sm">Upload content to generate flashcards</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cards list header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Generated Flashcards ({cards.length})
        </h3>

        {loadingCards.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            Processing {loadingCards.size} card
            {loadingCards.size !== 1 ? "s" : ""}...
          </div>
        )}
      </div>

      {/* Cards grid - optimized for performance */}
      <div className="space-y-4">
        {cards.map((card) => {
          const isEditing = editStates[card.id] !== undefined;
          const editState = editStates[card.id];
          const isSelected = selectedCards.has(card.id);
          const isLoading = loadingCards.has(card.id);

          return (
            <CardEditor
              key={card.id}
              card={card}
              editState={editState}
              isEditing={isEditing}
              isSelected={isSelected}
              onSave={() => handleSaveCard(card.id)}
              onCancel={() => onCancelEdit(card.id)}
              onEdit={() => onStartEdit(card.id)}
              onDelete={() => handleCardDelete(card.id)}
              onUpdateField={(field, value) =>
                handleUpdateField(card.id, field, value)
              }
              onToggleSelection={() => onCardSelect(card.id)}
              disabled={isLoading}
              showSelection={true}
              showValidation={true}
            />
          );
        })}
      </div>

      {/* Performance info for large lists */}
      {cards.length > 20 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Showing all {cards.length} cards • Consider using bulk actions for
          efficiency
        </div>
      )}
    </div>
  );
});
