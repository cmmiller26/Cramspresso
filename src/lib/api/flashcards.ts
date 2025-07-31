import type {
  ContentAnalysis,
  GeneratedCard,
  GenerateCardsResponse,
  RegenerateCardResponse,
  ImprovementRequest,
  ImprovementResponse,
} from "@/lib/types/api";

/**
 * Generate flashcards from text content using optional analysis
 */
export async function generateCards(
  text: string,
  analysis?: ContentAnalysis
): Promise<GeneratedCard[]> {
  const response = await fetch("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, analysis }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate flashcards");
  }

  const data: GenerateCardsResponse = await response.json();

  if (!Array.isArray(data.cards)) {
    throw new Error(
      "Invalid response: `cards` field is missing or not an array"
    );
  }

  // Validate card structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.cards.forEach((card: any, index: number) => {
    if (
      typeof card?.question !== "string" ||
      typeof card?.answer !== "string"
    ) {
      throw new Error(`Invalid response: card at index ${index} is malformed`);
    }
  });

  return data.cards;
}

/**
 * Regenerate/improve a single flashcard
 */
export async function regenerateCard(
  originalCard: { question: string; answer: string },
  instruction: string,
  context?: string,
  contentType?: string
): Promise<{ question: string; answer: string }> {
  const response = await fetch("/api/flashcards/regenerate-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalCard,
      instruction,
      context,
      contentType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to regenerate card");
  }

  const data: RegenerateCardResponse = await response.json();

  if (
    !data.card ||
    typeof data.card.question !== "string" ||
    typeof data.card.answer !== "string"
  ) {
    throw new Error("Invalid response: card data is malformed");
  }

  return data.card;
}

/**
 * Apply bulk improvements to multiple flashcards
 */
export async function improveCardSet(
  request: ImprovementRequest
): Promise<GeneratedCard[]> {
  const response = await fetch("/api/flashcards/improve-set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to improve card set");
  }

  const data: ImprovementResponse = await response.json();

  if (!Array.isArray(data.cards)) {
    throw new Error(
      "Invalid response: `cards` field is missing or not an array"
    );
  }

  // Validate improved cards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.cards.forEach((card: any, index: number) => {
    if (
      typeof card?.question !== "string" ||
      typeof card?.answer !== "string"
    ) {
      throw new Error(
        `Invalid response: improved card at index ${index} is malformed`
      );
    }
  });

  return data.cards;
}
