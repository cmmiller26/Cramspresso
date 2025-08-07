import type { GeneratedCard } from "@/lib/types/api";
import type { ContentAnalysis } from "@/lib/types/api";

interface SessionData {
  cards: GeneratedCard[];
  analysis: ContentAnalysis | null;
  sourceText: string;
  timestamp: number;
}

// Type for the window object with our custom property
declare global {
  interface Window {
    __cramspresson_session?: SessionData;
  }
}

const SESSION_KEY = "cramspresso_current_session";
const SESSION_TIMEOUT = 1000 * 60 * 60; // 1 hour

export class CardsSessionStorage {
  static save(
    cards: GeneratedCard[],
    analysis: ContentAnalysis | null,
    sourceText: string
  ): void {
    try {
      const sessionData: SessionData = {
        cards,
        analysis,
        sourceText,
        timestamp: Date.now(),
      };

      // Store in memory for component communication (fallback for Claude.ai artifacts)
      window.__cramspresson_session = sessionData;

      // Also try sessionStorage if available
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.warn("Failed to save session data:", error);
    }
  }

  static load(): SessionData | null {
    try {
      // First try memory storage
      const memoryData = window.__cramspresson_session;
      if (memoryData && this.isValidSession(memoryData)) {
        return memoryData;
      }

      // Fallback to sessionStorage if available
      if (typeof window !== "undefined" && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as unknown;
          if (this.isValidSession(parsed)) {
            return parsed;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn("Failed to load session data:", error);
      return null;
    }
  }

  static clear(): void {
    try {
      // Clear memory storage
      delete window.__cramspresson_session;

      // Clear sessionStorage if available
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      console.warn("Failed to clear session data:", error);
    }
  }

  static hasValidSession(): boolean {
    const data = this.load();
    return data !== null && data.cards.length > 0;
  }

  private static isValidSession(data: unknown): data is SessionData {
    if (!data || typeof data !== "object" || data === null) return false;

    const candidate = data as Record<string, unknown>;
    const { cards, timestamp } = candidate;

    // Check if session is too old
    if (
      typeof timestamp !== "number" ||
      Date.now() - timestamp > SESSION_TIMEOUT
    ) {
      return false;
    }

    // Check if cards exist and are valid
    return Array.isArray(cards) && cards.length > 0;
  }
}
