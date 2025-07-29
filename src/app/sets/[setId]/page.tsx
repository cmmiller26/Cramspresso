"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { SetOverview } from "@/components/sets/SetOverview";
import { SetActions } from "@/components/sets/SetActions";
import { CardList } from "@/components/sets/CardList";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/lib/flashcards";
import { deleteSet } from "@/lib/flashcardApi";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async () => {
    await deleteSet(setId);
    // Navigation handled by SetActions component
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
          <button
            onClick={() => router.push("/dashboard")}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
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
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Set Overview */}
        <SetOverview
          setName={setData?.name || ""}
          cardCount={setData?.cards.length || 0}
          createdAt={setData?.createdAt}
          updatedAt={setData?.updatedAt}
          loading={loading}
        />

        {/* Actions */}
        {setData && (
          <SetActions
            setId={setId}
            setName={setData.name}
            cardCount={setData.cards.length}
            onDelete={handleDelete}
            loading={loading}
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
            loading={loading}
          />
        </div>
      </main>
    </>
  );
}
