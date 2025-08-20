import type { CreateFlashcard } from "@/lib/types/flashcards";

/**
 * Create a new flashcard set with cards
 */
export async function createSet(
  name: string,
  cards: CreateFlashcard[]
): Promise<{ setId: string }> {
  const response = await fetch("/api/sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cards }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create set");
  }

  const data = await response.json();

  if (typeof data.id !== "string") {
    throw new Error("Invalid response: `id` field is missing or not a string");
  }

  return { setId: data.id };
}

/**
 * Add cards to an existing set
 */
export async function addCardsToSet(
  setId: string,
  cards: CreateFlashcard[]
): Promise<void> {
  const response = await fetch(`/api/sets/${setId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to add cards to set");
  }
}

/**
 * Update a specific card in a set
 */
export async function updateCard(
  setId: string,
  cardId: string,
  updates: { question: string; answer: string }
): Promise<void> {
  const response = await fetch(`/api/sets/${setId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update card");
  }
}

/**
 * Delete a card from a set
 */
export async function deleteCard(setId: string, cardId: string): Promise<void> {
  const response = await fetch(`/api/sets/${setId}/cards/${cardId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete card");
  }
}

/**
 * Update set name
 */
export async function updateSetName(
  setId: string,
  name: string
): Promise<void> {
  const response = await fetch(`/api/sets/${setId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update set name");
  }
}

/**
 * Delete an entire set
 */
export async function deleteSet(setId: string): Promise<void> {
  const response = await fetch(`/api/sets/${setId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete set");
  }
}
