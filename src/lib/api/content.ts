import type { AnalyzeContentResponse } from "@/lib/types/create";

/**
 * Analyze content using AI to determine optimal flashcard generation strategy
 */
export async function analyzeContent(
  text: string,
  signal?: AbortSignal
): Promise<AnalyzeContentResponse> {
  const response = await fetch("/api/content/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal, // Add abort signal support
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Content analysis failed (${response.status})`
    );
  }

  const data = await response.json();

  // Validate response structure
  if (!data.analysis) {
    throw new Error("Invalid response: missing analysis data");
  }

  return data;
}

/**
 * Extract text from uploaded file URL
 */
export async function extractTextFromFile(url: string): Promise<string> {
  const response = await fetch("/api/content/extract-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to extract text from file");
  }

  const data = await response.json();

  if (typeof data.text !== "string") {
    throw new Error("Invalid response: text field is missing or not a string");
  }

  return data.text;
}
