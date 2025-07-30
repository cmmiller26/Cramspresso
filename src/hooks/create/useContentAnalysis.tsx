import { useState, useCallback } from "react";

export interface ContentAnalysis {
  contentType: "vocabulary" | "concepts" | "mixed" | "other";
  confidence: number;
  summary: string;
  keyTopics: string[];
  vocabularyTerms: Array<{ term: string; definition?: string }>;
  estimatedCards: number;
  suggestedFocus: string[];
  reasoning: string;
}

interface AnalysisState {
  isAnalyzing: boolean;
  analysis: ContentAnalysis | null;
  error: string | null;
}

export function useContentAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    analysis: null,
    error: null,
  });

  const analyzeContent = useCallback(
    async (text: string): Promise<ContentAnalysis> => {
      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      try {
        const response = await fetch("/api/content/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Analysis failed (${response.status})`
          );
        }

        const { analysis } = await response.json();

        setState((prev) => ({
          ...prev,
          analysis,
          isAnalyzing: false,
        }));

        return analysis;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to analyze content";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isAnalyzing: false,
        }));

        throw error;
      }
    },
    []
  );

  const clearAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysis: null,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    analyzeContent,
    clearAnalysis,
    clearError,
  };
}
