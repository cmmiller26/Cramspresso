"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetEditor } from "@/components/sets/SetEditor";
import { UploadZone } from "@/components/shared/UploadZone";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useLoadingState, LOADING_STATES } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import type { Flashcard } from "@/lib/types/flashcards";
import * as setsApi from "@/lib/api/sets";

interface SetData {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export default function SetEditorPage() {
  const { setId } = useParams() as { setId: string };
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [setData, setSetData] = useState<SetData | null>(null);
  
  // Set name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  
  // Shared infrastructure for loading states
  const { setLoading, isLoading, isAnyLoading } = useLoadingState([
    LOADING_STATES.SET_LOAD,
    LOADING_STATES.SET_NAME_UPDATE,
  ]);
  
  // Shared infrastructure for error handling  
  const { showError, clearError, renderError, hasError } = useErrorHandler();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const loadSet = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(LOADING_STATES.SET_LOAD, true);
    clearError();
    try {
      // Use centralized API client
      const data = await setsApi.getSetById(setId);
      setSetData(data);
      setEditingName(data.name);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load flashcard set";
      
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        showError(
          "SET_NOT_FOUND",
          "This flashcard set was not found. It may have been deleted or you may not have permission to edit it.",
          {
            onRetry: () => loadSet(),
            onDismiss: () => router.push("/dashboard"),
          }
        );
      } else {
        showError(
          "SET_LOAD_ERROR",
          errorMessage,
          {
            onRetry: () => loadSet(),
            onDismiss: clearError,
          }
        );
      }
    } finally {
      setLoading(LOADING_STATES.SET_LOAD, false);
    }
  }, [setId, isSignedIn, setLoading, clearError, showError, router]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  const handleAddCard = async (newCard: Omit<Flashcard, "id">) => {
    // Optimistic update: Add temporary card immediately for better perceived performance
    const tempId = `temp-${Date.now()}`;
    const tempCard: Flashcard = {
      ...newCard,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Update UI immediately
    setSetData((prev) => prev ? {
      ...prev,
      cards: [...prev.cards, tempCard],
    } : null);
    
    try {
      // Cast to Flashcard since addCardsToSet can handle cards without IDs
      await setsApi.addCardsToSet(setId, [newCard as Flashcard]);
      // Refresh to get the real card with proper ID from server
      await loadSet();
    } catch (error) {
      // Rollback optimistic update on error
      setSetData((prev) => prev ? {
        ...prev,
        cards: prev.cards.filter(card => card.id !== tempId),
      } : null);
      throw error; // Re-throw so SetEditor can handle the error display
    }
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: { question: string; answer: string }
  ) => {
    // Store original card for potential rollback
    const originalCard = setData?.cards.find(card => card.id === cardId);
    
    // Optimistic update: Update UI immediately
    setSetData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) =>
              card.id === cardId 
                ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                : card
            ),
          }
        : null
    );
    
    try {
      await setsApi.updateCard(setId, cardId, updates);
    } catch (error) {
      // Rollback optimistic update on error
      if (originalCard) {
        setSetData((prev) =>
          prev
            ? {
                ...prev,
                cards: prev.cards.map((card) =>
                  card.id === cardId ? originalCard : card
                ),
              }
            : null
        );
      }
      throw error; // Re-throw so SetEditor can handle the error display
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    // Store original card for potential rollback
    const originalCard = setData?.cards.find(card => card.id === cardId);
    const originalIndex = setData?.cards.findIndex(card => card.id === cardId) ?? -1;
    
    // Optimistic update: Remove from UI immediately
    setSetData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.filter((card) => card.id !== cardId),
          }
        : null
    );
    
    try {
      await setsApi.deleteCard(setId, cardId);
    } catch (error) {
      // Rollback optimistic update on error
      if (originalCard && originalIndex >= 0) {
        setSetData((prev) => {
          if (!prev) return null;
          const newCards = [...prev.cards];
          newCards.splice(originalIndex, 0, originalCard);
          return {
            ...prev,
            cards: newCards,
          };
        });
      }
      throw error; // Re-throw so SetEditor can handle the error display
    }
  };

  const handleUploadComplete = async (files: { ufsUrl: string }[]) => {
    console.log("Files uploaded:", files);
    try {
      // TODO: Implement actual file processing and card generation
      throw new Error("File upload handling not implemented yet");

      /**
      const urls = files.map((f) => f.ufsUrl);
      if (newCards.length === 0) {
        showError(
          "NO_CARDS_GENERATED",
          "No flashcards were generated from the uploaded files. Please try again with different content.",
          { onDismiss: clearError }
        );
        return;
      }
      await setsApi.addCardsToSet(setId, newCards);
      await loadSet(); // Refresh to get new cards with IDs
      */
    } catch (error) {
      console.error("Error uploading and generating cards:", error);
      showError(
        "UPLOAD_GENERATION_ERROR",
        error instanceof Error ? error.message : "Failed to generate cards from upload. Please try again.",
        {
          onRetry: () => handleUploadComplete(files),
          onDismiss: clearError,
        }
      );
    }
  };

  const handleSaveSetName = async () => {
    if (!editingName.trim() || editingName === setData?.name) {
      setIsEditingName(false);
      return;
    }

    // Store original name for potential rollback
    const originalName = setData?.name;
    const newName = editingName.trim();
    
    // Optimistic update: Update UI immediately
    setSetData((prev) => prev ? {
      ...prev,
      name: newName,
      updatedAt: new Date().toISOString(),
    } : null);
    setIsEditingName(false);

    setLoading(LOADING_STATES.SET_NAME_UPDATE, true);
    try {
      clearError();
      await setsApi.updateSetName(setId, newName);
    } catch (error) {
      console.error("Error updating set name:", error);
      
      // Rollback optimistic update on error
      if (originalName) {
        setSetData((prev) => prev ? {
          ...prev,
          name: originalName,
        } : null);
        setEditingName(originalName);
        setIsEditingName(true); // Re-enable editing mode
      }
      
      showError(
        "SET_NAME_UPDATE_ERROR",
        error instanceof Error ? error.message : "Failed to update set name. Please try again.",
        {
          onRetry: () => handleSaveSetName(),
          onDismiss: clearError,
        }
      );
    } finally {
      setLoading(LOADING_STATES.SET_NAME_UPDATE, false);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(setData?.name || "");
    setIsEditingName(false);
  };

  // Show loading state while checking auth
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        {renderError()}
      </main>
    );
  }

  return (
    <>
      <title>
        {setData?.name ? `Edit ${setData.name} - Cramspresso` : "Loading..."}
      </title>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Navigation */}
          <LoadingButton
            variant="ghost"
            onClick={async () => router.push(`/sets/${setId}`)}
            className="mb-2"
            loadingText="Loading Set Details..."
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Set Details
          </LoadingButton>

          {/* Set Name Editor */}
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  disabled={isLoading(LOADING_STATES.SET_NAME_UPDATE)}
                  className="text-xl font-bold"
                  placeholder="Set name..."
                />
                <LoadingButton
                  onClick={handleSaveSetName}
                  disabled={!editingName.trim() || isLoading(LOADING_STATES.SET_NAME_UPDATE)}
                  size="sm"
                  loadingText="Saving Name..."
                >
                  Save
                </LoadingButton>
                <Button
                  variant="outline"
                  onClick={handleCancelEditName}
                  disabled={isLoading(LOADING_STATES.SET_NAME_UPDATE)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-1">
                <h1 className="text-2xl font-bold text-foreground flex-1">
                  {setData?.name || "Untitled Set"}
                </h1>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingName(true)}
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Name
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Upload & Generate More Cards
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload additional documents to generate more flashcards for this
            set.
          </p>
          <UploadZone onClientUploadComplete={handleUploadComplete} />
        </div>

        {/* Editor */}
        {setData && (
          <SetEditor
            cards={setData.cards}
            onAddCard={handleAddCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            loading={isAnyLoading()}
          />
        )}
      </main>
    </>
  );
}
