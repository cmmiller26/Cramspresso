import React from "react";
import { AnalysisDisplay } from "@/components/create/generation/AnalysisDisplay";
import { CardList } from "./CardList";
import { SelectionControls } from "./SelectionControls";
import { SaveSetDialog } from "./SaveSetDialog";
import { AISuggestions } from "@/components/create/cards/AISuggestions";
import { BulkImprovements } from "@/components/create/cards/BulkImprovements";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import type { ContentAnalysis, EditStatesMap, AISuggestion, BulkImprovementType } from "@/lib/types/create";
import type { ReviewFlashcard } from "@/lib/types/flashcards";

interface ReviewContainerProps {
  cards: ReviewFlashcard[];
  analysis: ContentAnalysis | null;
  sourceText: string;
  selectedCards: Set<string>;
  editStates: EditStatesMap;
  isSaving: boolean;
  saveProgress: number;
  onCardUpdate: (
    cardId: string,
    updates: Partial<ReviewFlashcard>
  ) => Promise<void>;
  onCardDelete: (cardId: string) => Promise<void>;
  onBulkDelete: (cardIds: string[]) => Promise<void>;
  onToggleSelection: (cardId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onStartEdit: (cardId: string) => void;
  onCancelEdit: (cardId: string) => void;
  onSaveSet: (name: string) => Promise<void>;
  // AI Features
  suggestions: AISuggestion[];
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  onBulkImprove: (
    improvementType: BulkImprovementType,
    customInstruction?: string,
    targetCardCount?: number
  ) => Promise<void>;
  onRefineCard: (cardId: string, instruction: string) => Promise<void>;
  onRequestSuggestions: () => Promise<void>;
  isGeneratingSuggestions: boolean;
  isImproving: boolean;
  improvementProgress: number;
  currentOperation: string;
  className?: string;
}

export function ReviewContainer({
  cards,
  analysis,
  selectedCards,
  editStates,
  isSaving,
  saveProgress,
  onCardUpdate,
  onCardDelete,
  onBulkDelete,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onStartEdit,
  onCancelEdit,
  onSaveSet,
  // AI Features
  suggestions,
  onApplySuggestion,
  onBulkImprove,
  onRefineCard,
  onRequestSuggestions,
  isGeneratingSuggestions,
  isImproving,
  improvementProgress,
  currentOperation,
  className = "",
}: ReviewContainerProps) {
  const { isLoading } = useLoadingState([
    "save-set",
    "bulk-delete",
    "card-operations",
  ]);
  const { renderError } = useErrorHandler();
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const handleBulkDelete = async () => {
    const selectedCardIds = Array.from(selectedCards);
    if (selectedCardIds.length === 0) return;

    await onBulkDelete(selectedCardIds);
    onClearSelection();
  };

  const handleSaveSet = async (name: string) => {
    try {
      await onSaveSet(name);
      setShowSaveDialog(false);
    } catch (error) {
      // Error handling managed by parent hook
      console.error("Save failed:", error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {renderError()}

      {/* Analysis Display */}
      {analysis && (
        <AnalysisDisplay
          analysis={analysis}
          isExpanded={showAnalysis}
          onToggle={() => setShowAnalysis(!showAnalysis)}
          compact={false}
        />
      )}

      {/* AI Suggestions */}
      <AISuggestions
        suggestions={suggestions}
        isGenerating={isGeneratingSuggestions}
        onApplySuggestion={onApplySuggestion}
        onGenerateMore={onRequestSuggestions}
      />

      {/* Selection Controls with Bulk Improvements */}
      <div className="space-y-4">
        <SelectionControls
          selectedCount={selectedCards.size}
          totalCount={cards.length}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          onBulkDelete={handleBulkDelete}
          disabled={isLoading("bulk-delete")}
          showBulkActions={selectedCards.size > 0}
        />

        {/* Bulk Improvements */}
        <BulkImprovements
          selectedCount={selectedCards.size}
          isImproving={isImproving}
          progress={improvementProgress}
          currentOperation={currentOperation}
          onImprove={(improvement, customInstruction, targetCardCount) => 
            onBulkImprove(improvement as BulkImprovementType, customInstruction, targetCardCount)
          }
        />
      </div>

      {/* Card List */}
      <CardList
        cards={cards}
        selectedCards={selectedCards}
        editStates={editStates}
        onCardUpdate={onCardUpdate}
        onCardDelete={onCardDelete}
        onCardSelect={onToggleSelection}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onRefineCard={onRefineCard}
      />

      {/* Save Actions */}
      <div className="flex justify-between items-center p-6 bg-card border border-border rounded-lg">
        <div>
          <h3 className="font-semibold text-foreground">
            Ready to save your flashcard set?
          </h3>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? "s" : ""} ready for
            studying
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={cards.length === 0 || isSaving}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? `Saving... ${Math.round(saveProgress)}%`
              : "Save Flashcard Set"}
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      <SaveSetDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveSet}
        isSaving={isSaving}
        saveProgress={saveProgress}
        cardCount={cards.length}
        analysis={analysis}
      />
    </div>
  );
}
