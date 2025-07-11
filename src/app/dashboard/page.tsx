"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { NewSetForm } from "@/components/NewSetForm";
import { Button } from "@/components/ui/button";

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
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-6">Your Flashcard Sets</h1>
        <div className="mb-8">
          <NewSetForm onCreate={(id) => router.push(`/sets/${id}`)} />
        </div>
        {loading ? (
          <p>Loading your sets...</p>
        ) : error ? (
          <p className="text-red-600 mb-4">Error: {error}</p>
        ) : sets.length === 0 ? (
          <p>No flashcard sets found. Create a new set to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <div
                key={set.id}
                className="p-4 border rounded-xl hover:shadow transition"
              >
                <h2 className="text-lg font-semibold">{set.name}</h2>
                <p className="text-sm text-gray-600">
                  {set._count.cards} card{set._count.cards === 1 ? "" : "s"}
                </p>
                <Link href={`/sets/${set.id}`}>
                  <Button className="mt-4">View &amp; Edit</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
