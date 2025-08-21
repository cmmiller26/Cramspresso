"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { NewSetForm } from "@/components/dashboard/NewSetForm";
import { SetGrid } from "@/components/dashboard/SetGrid";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useLoadingState, LOADING_STATES } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import * as setsApi from "@/lib/api/sets";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { setLoading, isLoading } = useLoadingState([
    LOADING_STATES.DASHBOARD_INIT,
    LOADING_STATES.SETS_FETCH
  ]);
  const { showError, clearError } = useErrorHandler();

  const wasSignedInRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      wasSignedInRef.current = true;
      return;
    }
    if (!wasSignedInRef.current) {
      router.push("/sign-in");
    } else {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const [sets, setSets] = useState<SetItem[]>([]);
  const [showNewSetForm, setShowNewSetForm] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchSets = async () => {
      try {
        setLoading(LOADING_STATES.SETS_FETCH, true);
        const sets = await setsApi.getSets();
        setSets(sets);
      } catch (err) {
        console.error(err);
        showError(
          "GENERIC_ERROR",
          err instanceof Error ? err.message : "Failed to load flashcard sets",
          {
            onRetry: fetchSets,
            onDismiss: clearError,
          }
        );
      } finally {
        setLoading(LOADING_STATES.SETS_FETCH, false);
      }
    };

    fetchSets();
  }, [isLoaded, isSignedIn, setLoading, showError, clearError]);

  // Show loading for auth redirect
  if (!isLoaded || !isSignedIn) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner 
          size="lg" 
          text="Redirecting to sign-in..." 
        />
      </main>
    );
  }

  return (
    <>
      <title>Dashboard</title>
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your flashcard sets and track your progress
            </p>
          </div>
          <div className="flex gap-3">
            {/* New Upload Flow Button */}
            <LoadingButton
              onClick={async () => router.push("/create")}
              className="w-fit"
              size="lg"
              loadingText="Loading..."
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Generate
            </LoadingButton>
            {/* Original Create Button (for manual sets) */}
            <Button
              variant="outline"
              onClick={() => setShowNewSetForm(!showNewSetForm)}
              className="w-fit"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Empty Set
            </Button>
          </div>
        </div>

        {/* New Set Form */}
        {showNewSetForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Empty Flashcard Set</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a set manually without uploading content. You can add
                cards later.
              </p>
            </CardHeader>
            <CardContent>
              <NewSetForm
                variant="dashboard"
                onCreate={(id) => {
                  router.push(`/sets/${id}`);
                  setShowNewSetForm(false);
                }}
                onCancel={() => setShowNewSetForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <StatsOverview
          sets={sets}
          loading={isLoading(LOADING_STATES.SETS_FETCH)}
          error={null} // Errors are handled centrally now
          onRetry={() => window.location.reload()}
        />

        {/* Sets Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Flashcard Sets</h2>
          <SetGrid 
            sets={sets} 
            loading={isLoading(LOADING_STATES.SETS_FETCH)}
            error={null} // Errors are handled centrally now
          />
        </div>
      </main>
    </>
  );
}
