import type {
  ContentAnalysis,
  BulkImprovementRequest,
  BulkImprovementResult,
} from "@/lib/types/create";
import type { GeneratedCard } from "@/lib/types/flashcards";

/**
 * Generate flashcards from text content using AI analysis
 */
export async function generateCards(
  text: string,
  analysis: ContentAnalysis,
  signal?: AbortSignal
): Promise<GeneratedCard[]> {
  const response = await fetch("/api/flashcards/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, analysis }),
    signal, // Pass the abort signal to fetch
  });

  // Handle aborted requests
  if (signal?.aborted) {
    throw new Error("Request was cancelled");
  }

  if (!response.ok) {
    let errorMessage = `Flashcard generation failed (${response.status})`;

    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === "object" && errorData.error) {
        errorMessage = errorData.error;
      } else if (
        errorData &&
        typeof errorData === "object" &&
        errorData.details
      ) {
        errorMessage = errorData.details;
      }
    } catch {
      // If we can't parse the error response, use status-based messages
      if (response.status === 400) {
        errorMessage =
          "Invalid content provided. Please check your text and try again.";
      } else if (response.status === 401) {
        errorMessage = "Authentication failed. Please refresh and try again.";
      } else if (response.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (response.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      }
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Validate response structure
  if (!Array.isArray(data.cards)) {
    throw new Error("Invalid response: cards field is missing or not an array");
  }

  return data.cards;
}

/**
 * FIXED: Regenerate/improve a single flashcard with proper signature and stub implementation
 */
export async function regenerateCard(
  originalCard: { question: string; answer: string },
  instruction: string,
  context?: string,
  contentType?: string,
  signal?: AbortSignal
): Promise<{ question: string; answer: string }> {
  console.log("🔍 DEBUG: regenerateCard called with:", {
    originalCard,
    instruction,
    contextLength: context?.length || 0,
    contentType,
    hasSignal: !!signal,
  });

  // FIXED: Validate input properly
  if (!originalCard) {
    const error = "Original card object is required";
    console.error("❌ DEBUG:", error);
    throw new Error(error);
  }

  if (!originalCard.question?.trim()) {
    const error = "Original card must have a question";
    console.error("❌ DEBUG:", error, { originalCard });
    throw new Error(error);
  }

  if (!originalCard.answer?.trim()) {
    const error = "Original card must have an answer";
    console.error("❌ DEBUG:", error, { originalCard });
    throw new Error(error);
  }

  if (!instruction?.trim()) {
    const error = "Improvement instruction is required";
    console.error("❌ DEBUG:", error);
    throw new Error(error);
  }

  try {
    console.log(
      "📡 DEBUG: Making API request to /api/flashcards/regenerate-card"
    );

    const response = await fetch("/api/flashcards/regenerate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalCard: originalCard,
        instruction: instruction.trim(),
        context,
        contentType,
      }),
      signal,
    });

    // Handle aborted requests
    if (signal?.aborted) {
      throw new Error("Request was cancelled");
    }

    if (!response.ok) {
      let errorMessage = `Card regeneration failed (${response.status})`;

      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === "object" && errorData.error) {
          errorMessage = errorData.error;
        } else if (
          errorData &&
          typeof errorData === "object" &&
          errorData.details
        ) {
          errorMessage = errorData.details;
        }
      } catch {
        // Fallback to status-based messages
        if (response.status >= 500) {
          errorMessage =
            "Server error while regenerating card. Please try again.";
        }
      }

      console.error("❌ DEBUG: API request failed", {
        status: response.status,
        errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("✅ DEBUG: API response received", { data });

    // Validate response structure and return the card directly
    if (
      !data.card ||
      typeof data.card.question !== "string" ||
      typeof data.card.answer !== "string"
    ) {
      const error = "Invalid response: card data is missing or malformed";
      console.error("❌ DEBUG:", error, { responseData: data });
      throw new Error(error);
    }

    console.log("✅ DEBUG: Card regeneration successful", {
      improvedCard: data.card,
    });
    return data.card;
  } catch (error) {
    console.error("❌ DEBUG: regenerateCard failed", error);
    throw error;
  }
}

/**
 * FIXED: Apply bulk improvements to flashcard sets with proper validation and stub implementation
 */
export async function improveCardSet(
  request: BulkImprovementRequest,
  signal?: AbortSignal
): Promise<BulkImprovementResult> {
  console.log("🔍 DEBUG: improveCardSet called with:", {
    cardsCount: request.selectedCards?.length || 0,
    improvementType: request.improvementType,
    customInstruction: request.customInstruction,
    targetCardCount: request.targetCardCount,
    contextLength: request.context?.length || 0,
    contentType: request.contentType,
  });

  // FIXED: Validate input properly
  if (!request) {
    const error = "Improvement request is required";
    console.error("❌ DEBUG:", error);
    throw new Error(error);
  }

  if (
    !Array.isArray(request.selectedCards) ||
    request.selectedCards.length === 0
  ) {
    const error = "At least one card is required for improvement";
    console.error("❌ DEBUG:", error, { request });
    throw new Error(error);
  }

  if (!request.improvementType?.trim()) {
    const error = "Improvement type is required";
    console.error("❌ DEBUG:", error, { request });
    throw new Error(error);
  }

  // Validate each card has required fields
  for (let i = 0; i < request.selectedCards.length; i++) {
    const card = request.selectedCards[i];
    if (!card.question?.trim() || !card.answer?.trim()) {
      const error = `Card ${i + 1} is missing question or answer`;
      console.error("❌ DEBUG:", error, { card });
      throw new Error(error);
    }
  }

  try {
    console.log("📡 DEBUG: Making API request to /api/flashcards/improve-set");

    const response = await fetch("/api/flashcards/improve-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });

    // Handle aborted requests
    if (signal?.aborted) {
      throw new Error("Request was cancelled");
    }

    if (!response.ok) {
      let errorMessage = `Card set improvement failed (${response.status})`;

      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === "object" && errorData.error) {
          errorMessage = errorData.error;
        } else if (
          errorData &&
          typeof errorData === "object" &&
          errorData.details
        ) {
          errorMessage = errorData.details;
        }
      } catch {
        // Fallback to status-based messages
        if (response.status >= 500) {
          errorMessage =
            "Server error while improving cards. Please try again.";
        }
      }

      console.error("❌ DEBUG: API request failed", {
        status: response.status,
        errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("✅ DEBUG: API response received", { data });

    // Validate response structure and return cards directly
    if (!Array.isArray(data.cards)) {
      const error = "Invalid response: cards field is missing or not an array";
      console.error("❌ DEBUG:", error, { responseData: data });
      throw new Error(error);
    }

    console.log("✅ DEBUG: Bulk improvement successful", {
      improvedCount: data.cards.length,
    });
    return data.cards;
  } catch (error) {
    console.error("❌ DEBUG: improveCardSet failed", error);
    throw error;
  }
}
