"use client";

import { useEffect, useState } from "react";
import { ClientUploadedFileData } from "uploadthing/types";
import { Flashcard } from "@/lib/flashcards";
import { UploadDropzone, useUploadThing } from "@/lib/uploadthing";

export default function Home() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [hasSaved, setHasSaved] = useState(true);

  const { startUpload } = useUploadThing("pdfAndTxt");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/flashcards");
        if (res.ok) {
          const { cards: saved } = await res.json();
          setCards(saved);
        } else {
          console.error("Failed to load cards:", res.status, res.statusText);
        }
      } catch (err) {
        console.error("Error fetching cards:", err);
      }
    })();
  }, []);

  const handleUploadComplete = async (
    files: ClientUploadedFileData<null>[]
  ) => {
    if (files.length === 0) return;

    try {
      const url = files[0].ufsUrl;
      const extRes = await fetch("/api/flashcards/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!extRes.ok) throw new Error(await extRes.text());
      const { text } = await extRes.json();

      const genRes = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());
      const { cards: newCards } = await genRes.json();
      if (newCards.length === 0) {
        alert("No flashcards generated from the uploaded file.");
        return;
      }

      setCards((prev) => [...newCards, ...prev]);
      setSavedCount(null);
      setHasSaved(false);
    } catch (err) {
      console.error("Error processing upload:", err);
      alert(
        `Failed to process upload: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const saveCards = async () => {
    if (cards.length === 0) return;

    try {
      const res = await fetch("/api/flashcards/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Unknown error");

      setSavedCount(payload.savedCount);
      setHasSaved(true);
    } catch (err) {
      console.error("Error saving cards:", err);
      alert(
        `Failed to save cards: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Your Dashboard</h1>

      <>
        <UploadDropzone
          endpoint="pdfAndTxt"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(err) => alert(err.message)}
        />
        <input
          type="file"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            await startUpload(files);
          }}
        />
      </>

      {cards.length === 0 ? (
        <p>No flashcards yet: Upload a file to get started!</p>
      ) : (
        <>
          <ul className="grid gap-4">
            {cards.map((card, i) => (
              <li key={i} className="p-4 border rounded-lg">
                <p className="font-semibold">{card.question}</p>
                <p>{card.answer}</p>
              </li>
            ))}
          </ul>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={saveCards}
            disabled={hasSaved}
          >
            {hasSaved ? "Saved" : "Save to My Deck"}
          </button>

          {savedCount !== null && (
            <p>{savedCount} cards saved to your account!</p>
          )}
        </>
      )}
    </main>
  );
}
