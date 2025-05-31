import { Flashcard } from "./flashcards";

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
      typeof card !== "object" ||
      card === null ||
      typeof card.question !== "string" ||
      typeof card.answer !== "string"
    ) {
      throw new Error(
        `Invalid response: each card must have \'question\' and \'answer\' strings (error at index ${index})`
      );
    }
  });
  return parsed.cards as Flashcard[];
}

export async function generateFromUrls(urls: string[]): Promise<Flashcard[]> {
  if (!Array.isArray(urls)) throw new Error("URLs must be an array of strings");

  const texts = await Promise.all(urls.map(extractText));
  const cards = await Promise.all(texts.map(generateCards));
  return cards.flat();
}

export async function createSetWithCards(
  name: string,
  cards: Flashcard[]
): Promise<{ setId: string }> {
  const res = await fetch("/api/sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, cards }),
  });
  if (!res.ok) throw new Error("Failed to create set");
  return { setId: (await res.json()).id };
}

export async function appendCardsToSet(
  setId: string,
  cards: Flashcard[]
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  if (!res.ok) throw new Error("Failed to append cards");
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
  if (!res.ok) throw new Error("Failed to update card");
}

export async function deleteCardFromSet(
  setId: string,
  cardId: string
): Promise<void> {
  const res = await fetch(`/api/sets/${setId}/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete card");
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
