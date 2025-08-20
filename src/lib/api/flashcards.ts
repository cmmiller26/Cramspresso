import type { ContentAnalysis } from "@/lib/types/create";
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
