import { Flashcard } from "./flashcards";

async function extractText(url: string): Promise<string> {
  const res = await fetch("/api/flashcards/extract-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to extract text");
  return (await res.json()).text;
}

async function generateCards(text: string): Promise<Flashcard[]> {
  const res = await fetch("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to generate flashcards");
  return (await res.json()).cards;
}

export async function generateFromUrls(urls: string[]): Promise<Flashcard[]> {
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
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Failed to create set");
  return { setId: payload.id };
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
  if (!res.ok) throw new Error("Failed to append cards to set");
}
