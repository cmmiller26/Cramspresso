"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ReviewHeader } from "@/components/create/ReviewHeader";
import { BulkActions } from "@/components/create/BulkActions";
import { CardsList } from "@/components/create/CardsList";
import { SaveSection } from "@/components/create/SaveSection";
import { CardReviewSkeleton } from "@/components/shared/SkeletonLoader";
import { ReviewPageError } from "@/components/shared/ErrorStates";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { useReviewCards } from "@/hooks/create/useReviewCards";
import Link from "next/link";

type ViewMode = "preview" | "edit";

export default function ReviewPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  const {
    cards,
    loading,
    error,
    selectedCards,
    editStates,
    bulkOperationLoading,
    isSaving,
    saveProgress,
    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    updateEditState,
    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,
    // Save operations
    handleSaveSet,
    // Error handling
    clearError,
  } = useReviewCards();

  useEffect(() => {
    // Load cards on mount - this will be handled by the hook
  }, []);

  // Show skeleton while loading
  if (loading) {
    return <CardReviewSkeleton count={5} />;
  }

  // Show error page if there's a major error
  if (error && cards.length === 0) {
    return (
      <ReviewPageError
        error={error}
        onRetry={() => window.location.reload()}
        onGoBack={() => router.push("/create")}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/create" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Create
            </Link>
          </Button>
        </div>

        <ReviewHeader
          cardsCount={cards.length}
          selectedCount={selectedCards.size}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onBulkDelete={bulkDeleteCards}
          onClearSelection={clearSelection}
          bulkOperationLoading={bulkOperationLoading}
        />
      </div>

      {/* Error Display - for non-critical errors */}
      {error && cards.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {viewMode === "edit" && (
        <BulkActions
          cardsCount={cards.length}
          selectedCount={selectedCards.size}
          onSelectAll={selectAllCards}
          onClearSelection={clearSelection}
          onAddCard={addNewCard}
        />
      )}

      {/* Cards List */}
      <CardsList
        cards={cards}
        viewMode={viewMode}
        selectedCards={selectedCards}
        editStates={editStates}
        onToggleSelection={toggleCardSelection}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveCard={saveCard}
        onDeleteCard={deleteCard}
        onUpdateEditState={updateEditState}
      />

      {/* Save Section */}
      {cards.length > 0 && (
        <SaveSection
          cards={cards}
          isSaving={isSaving}
          saveProgress={saveProgress}
          onSave={handleSaveSet}
          onCancel={() => router.push("/create")}
        />
      )}

      {/* Empty State */}
      {cards.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No flashcards to review.</p>
          <LoadingButton onClick={() => router.push("/create")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back to Create
          </LoadingButton>
        </div>
      )}
    </div>
  );
}
