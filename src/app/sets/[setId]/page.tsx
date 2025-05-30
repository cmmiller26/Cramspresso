"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import {
  appendCardsToSet,
  generateFromUrls,
  updateCardInSet,
  deleteCardFromSet,
} from "@/lib/flashcardApi";
import { Flashcard } from "@/lib/flashcards";
import { Button } from "@/components/ui/button";

export default function SetEditor() {
  const { setId } = useParams() as { setId: string };
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");

  const loadSet = useCallback(async () => {
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
  }, [setId]);

  useEffect(() => {
    loadSet();
  }, [loadSet]);

  async function addNewCard() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newCard: Flashcard = {
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };
    await appendCardsToSet(setId, [newCard]);
    setNewQuestion("");
    setNewAnswer("");
    await loadSet();
  }

  function startEditingCard(card: Flashcard) {
    if (!card.id) {
      alert("Unsaved cards cannot be edited.");
      return;
    }
    setEditingCardId(card.id);
    setEditingQuestion(card.question);
    setEditingAnswer(card.answer);
  }

  async function saveEditedCard() {
    if (!editingCardId) return;
    await updateCardInSet(setId, editingCardId, {
      question: editingQuestion,
      answer: editingAnswer,
    });
    setEditingCardId(null);
    await loadSet();
  }

  function cancelEdit() {
    setEditingCardId(null);
    setEditingQuestion("");
    setEditingAnswer("");
  }

  async function deleteCard() {
    if (!editingCardId) return;

    const confirm = window.confirm(
      "Are you sure you want to delete this card? This action cannot be undone."
    );
    if (!confirm) return;

    await deleteCardFromSet(setId, editingCardId);
    setEditingCardId(null);
    await loadSet();
  }

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

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Create New Card</h2>
            <input
              className="border p-2 w-full"
              placeholder="Question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <input
              className="border p-2 w-full"
              placeholder="Answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            <Button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={addNewCard}
            >
              Add Card
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Cards</h2>
            <ul className="space-y-4">
              {cards.map((card, index) => (
                <li
                  key={card.id ?? `unsaved-${index}`}
                  className="border p-3 rounded space-y-2"
                >
                  {editingCardId === card.id ? (
                    <>
                      <input
                        className="border p-2 w-full"
                        value={editingQuestion}
                        onChange={(e) => setEditingQuestion(e.target.value)}
                      />
                      <input
                        className="border p-2 w-full"
                        value={editingAnswer}
                        onChange={(e) => setEditingAnswer(e.target.value)}
                      />
                      <div className="space-x-2">
                        <Button
                          className="bg-green-500 text-white px-3 py-1 rounded"
                          onClick={() => saveEditedCard()}
                        >
                          Save
                        </Button>
                        <Button
                          className="bg-gray-300 px-3 py-1 rounded"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-red-500 text-white px-3 py-1 rounded"
                          onClick={deleteCard}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{card.question}</p>
                      <p>{card.answer}</p>
                      {card.id ? (
                        <Button
                          className="text-sm text-blue-600"
                          onClick={() => startEditingCard(card)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Unsaved card
                        </p>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
