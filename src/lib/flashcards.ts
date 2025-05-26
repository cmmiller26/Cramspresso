export interface Flashcard {
  question: string;
  answer: string;
}

export function parseCompletionToCards(text: string): Flashcard[] {
  try {
    const parsed = JSON.parse(text) as Flashcard[];
    if (Array.isArray(parsed) && parsed.every((f) => f.question && f.answer)) {
      return parsed;
    }
  } catch (err) {
    console.error("Failed to parse flashcards:", err);
  }

  const cards: Flashcard[] = [];
  const regex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=(?:\r?\nQ:|$))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    cards.push({
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }
  return cards;
}
