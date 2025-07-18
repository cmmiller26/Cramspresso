import { CreateFlashcard, Flashcard } from "./flashcards";

export async function extractText(url: string): Promise<string> {
  const res = await fetch("/api/flashcards/extract-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to extract text");

  const parsed = await res.json();
  if (typeof parsed.text !== "string") {
    throw new Error(
      "Invalid response: `text` field is missing or not a string"
    );
  }
  return parsed.text;
}

export async function generateCards(text: string): Promise<Flashcard[]> {
  const res = await fetch("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to generate flashcards");

  const parsed = await res.json();
  if (!Array.isArray(parsed.cards)) {
    throw new Error(
      "Invalid response: `cards` field is missing or not an array"
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed.cards.forEach((card: any, index: number) => {
    if (
      typeof card?.question !== "string" ||
      typeof card?.answer !== "string"
    ) {
      throw new Error(`Invalid Response: card at index ${index} is malformed`);
    }
  });
  return parsed.cards as Flashcard[];
}

export async function generateFromUrls(urls: string[]): Promise<Flashcard[]> {
  if (!Array.isArray(urls) || !urls.every((url) => typeof url === "string"))
    throw new Error("URLs must be an array of strings");

  const texts = await Promise.all(urls.map(extractText));
  const cards = await Promise.all(texts.map(generateCards));
  return cards.flat();
}

export async function createSetWithCards(
  name: string,
  cards: CreateFlashcard[]
): Promise<{ setId: string }> {
  const res = await fetch("/api/sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cards }),
  });
  if (!res.ok) throw new Error("Failed to create set");

  const parsed = await res.json();
  if (typeof parsed.id !== "string") {
    throw new Error("Invalid response: `id` field is missing or not a string");
  }
  return { setId: parsed.id };
}

export async function appendCardsToSet(
  setId: string,
  cards: CreateFlashcard[]
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  if (!res.ok) throw new Error("Failed to append cards to set");
}

export async function updateCardInSet(
  setId: string,
  cardId: string,
  updates: { question: string; answer: string }
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update card in set");
}

export async function deleteCardFromSet(
  setId: string,
  cardId: string
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete card from set");
}

export async function updateSetName(
  setId: string,
  name: string
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to update set name");
}

export async function deleteSet(setId: string): Promise<void> {
  const res = await fetch(`/api/sets/${setId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete set");
}
