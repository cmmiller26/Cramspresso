"use client";

import { FormEvent, useState } from "react";
import { Button } from "./ui/button";
import { Flashcard } from "@/lib/flashcards";
import { createSetWithCards } from "@/lib/flashcardApi";

interface Props {
  cards?: Flashcard[];
  onCreate: (setId: string) => void;
}

export function NewSetForm({ cards = [], onCreate }: Props) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const { setId } = await createSetWithCards(name, cards);
      onCreate(setId);
    } catch (err) {
      console.error(err);
      alert(
        `Error creating set: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter new set name"
        className="border rounded px-3 py-2 flex-grow"
        disabled={creating}
      />
      <Button type="submit" disabled={creating || !name.trim()}>
        {creating ? "Creating..." : "Save Set"}
      </Button>
    </form>
  );
}
