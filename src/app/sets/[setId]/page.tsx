"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { appendCardsToSet, generateFromUrls } from "@/lib/flashcardApi";
import { Flashcard } from "@/lib/flashcards";

export default function SetEditor() {
  const { setId } = useParams() as { setId: string };
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSet() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sets/${setId}`);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Failed to load set");
        setCards(payload.cards);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [setId]);

  async function onUpload(files: { ufsUrl: string }[]) {
    const urls = files.map((f) => f.ufsUrl);
    const newCards = await generateFromUrls(urls);
    if (newCards.length === 0) {
      alert("No flashcards generated. Please try again with different files.");
      return;
    }
    await appendCardsToSet(setId, newCards);

    const res = await fetch(`/api/sets/${setId}`);
    if (!res.ok) throw new Error("Failed to refresh set");
    setCards(await res.json().then((data) => data.cards));
  }

  return (
    <main className="p-8 space-y-6">
      {loading ? (
        <p>Loading set...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <>
          <UploadZone onClientUploadComplete={onUpload} />

          <section>
            <h2 className="text-xl font-semibold">Cards</h2>
            <ul className="space-y-4">
              {cards.map((c, i) => (
                <li key={i} className="border p-3 rounded">
                  <p className="font-semibold">{c.question}</p>
                  <p>{c.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
