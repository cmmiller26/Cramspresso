"use client";

import { FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CreateFlashcard } from "@/lib/flashcards";
import { createSetWithCards } from "@/lib/flashcardApi";
import { Loader2, X } from "lucide-react";

interface Props {
  cards?: CreateFlashcard[];
  onCreate: (setId: string) => void;
  onCancel?: () => void;
  variant?: "dashboard" | "inline";
}

export function NewSetForm({
  cards = [],
  onCreate,
  onCancel,
  variant = "inline",
}: Props) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const { setId } = await createSetWithCards(name, cards);
      onCreate(setId);
      setName(""); // Reset form on success
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

  function handleCancel() {
    setName("");
    onCancel?.();
  }

  if (variant === "dashboard") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="setName">Set Name</Label>
          <Input
            id="setName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your flashcard set"
            disabled={creating}
            className="text-base"
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={creating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Set"
            )}
          </Button>
        </div>
      </form>
    );
  }

  // Original inline variant for backward compatibility
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter new set name"
        disabled={creating}
        className="flex-grow"
      />
      <Button type="submit" disabled={creating || !name.trim()}>
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Save Set"
        )}
      </Button>
    </form>
  );
}
