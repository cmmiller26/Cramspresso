"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetEditor } from "@/components/sets/SetEditor";
import { UploadZone } from "@/components/shared/UploadZone";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const loadSet = useCallback(async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sets/${setId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Set not found");
        }
        throw new Error("Failed to load set");
      }

      const data = await res.json();
      setSetData(data);
      setEditingName(data.name);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [setId, isSignedIn]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  const handleAddCard = async (newCard: Omit<Flashcard, "id">) => {
    // Cast to Flashcard since appendCardsToSet can handle cards without IDs
    await setsApi.addCardsToSet(setId, [newCard as Flashcard]);
    await loadSet(); // Refresh the data
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: { question: string; answer: string }
  ) => {
    await setsApi.updateCard(setId, cardId, updates);
    // Update local state instead of refetching to preserve order
    setSetData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) =>
              card.id === cardId ? { ...card, ...updates } : card
            ),
          }
        : null
    );
  };

  const handleDeleteCard = async (cardId: string) => {
    await setsApi.deleteCard(setId, cardId);
    // Update local state instead of refetching
    setSetData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.filter((card) => card.id !== cardId),
          }
        : null
    );
  };

  const handleUploadComplete = async (files: { ufsUrl: string }[]) => {
    console.log("Files uploaded:", files);
    try {
      // TODO: Implement actual file processing and card generation
      throw new Error("File upload handling not implemented yet");

      /**
      const urls = files.map((f) => f.ufsUrl);
      if (newCards.length === 0) {
        alert(
          "No flashcards generated. Please try again with different files."
        );
        return;
      }
      await appendCardsToSet(setId, newCards);
      await loadSet(); // Refresh to get new cards with IDs
      */
    } catch (error) {
      console.error("Error uploading and generating cards:", error);
      alert("Failed to generate cards from upload. Please try again.");
    }
  };

  const handleSaveSetName = async () => {
    if (!editingName.trim() || editingName === setData?.name) {
      setIsEditingName(false);
      return;
    }

    setUpdatingName(true);
    try {
      await setsApi.updateSetName(setId, editingName.trim());
      await loadSet(); // Refresh the data
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating set name:", error);
      alert("Failed to update set name. Please try again.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(setData?.name || "");
    setIsEditingName(false);
  };

  // Show loading state while checking auth
  if (!isLoaded || !isSignedIn) {
    return <div className="p-6">Loading...</div>;
  }

  // Show error state
  if (error) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
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
          <Button
            variant="ghost"
            onClick={() => router.push(`/sets/${setId}`)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Set Details
          </Button>

          {/* Set Name Editor */}
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  disabled={updatingName}
                  className="text-xl font-bold"
                  placeholder="Set name..."
                />
                <Button
                  onClick={handleSaveSetName}
                  disabled={!editingName.trim() || updatingName}
                  size="sm"
                >
                  {updatingName ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEditName}
                  disabled={updatingName}
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
            loading={loading}
          />
        )}
      </main>
    </>
  );
}
