"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { NewSetForm } from "@/components/NewSetForm";
import { SetGrid } from "@/components/dashboard/SetGrid";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewSetForm, setShowNewSetForm] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    setLoading(true);

    fetch("/api/sets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sets");
        return res.json();
      })
      .then(setSets)
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) return <p>Redirecting to sign-in...</p>;

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
          <Button
            onClick={() => setShowNewSetForm(!showNewSetForm)}
            className="w-fit"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Set
          </Button>
        </div>

        {/* New Set Form */}
        {showNewSetForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Flashcard Set</CardTitle>
            </CardHeader>
            <CardContent>
              <NewSetForm
                onCreate={(id) => {
                  router.push(`/sets/${id}`);
                  setShowNewSetForm(false);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {!loading && !error && <StatsOverview sets={sets} />}

        {/* Sets Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Flashcard Sets</h2>
          <SetGrid sets={sets} loading={loading} error={error} />
        </div>
      </main>
    </>
  );
}
