"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { SetOverview } from "@/components/sets/SetOverview";
import { SetActions } from "@/components/sets/SetActions";
import { CardList } from "@/components/sets/CardList";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useLoadingState, LOADING_STATES } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { Flashcard } from "@/lib/types/flashcards";
import * as setsApi from "@/lib/api/sets";

interface SetData {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export default function SetDetailView() {
  const { setId } = useParams() as { setId: string };
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const [setData, setSetData] = useState<SetData | null>(null);
  
  // Shared infrastructure for loading states
  const { setLoading, isLoading } = useLoadingState([LOADING_STATES.SET_LOAD]);
  
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
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load flashcard set";
      
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        showError(
          "SET_NOT_FOUND",
          "This flashcard set was not found. It may have been deleted or you may not have permission to view it.",
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
        {setData?.name ? `${setData.name} - Cramspresso` : "Loading..."}
      </title>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Navigation */}
        <LoadingButton
          variant="ghost"
          onClick={async () => router.push("/dashboard")}
          className="mb-2"
          loadingText="Loading Dashboard..."
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </LoadingButton>

        {/* Set Overview */}
        <SetOverview
          setName={setData?.name || ""}
          cardCount={setData?.cards.length || 0}
          createdAt={setData?.createdAt}
          updatedAt={setData?.updatedAt}
          loading={isLoading(LOADING_STATES.SET_LOAD)}
        />

        {/* Actions */}
        {setData && (
          <SetActions
            setId={setId}
            setName={setData.name}
            cardCount={setData.cards.length}
            loading={isLoading(LOADING_STATES.SET_LOAD)}
          />
        )}

        {/* Cards List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Cards {setData && `(${setData.cards.length})`}
          </h2>
          <CardList
            cards={setData?.cards || []}
            variant="overview"
            loading={isLoading(LOADING_STATES.SET_LOAD)}
          />
        </div>
      </main>
    </>
  );
}
