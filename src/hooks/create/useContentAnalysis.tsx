import { useState, useCallback } from "react";
import * as contentApi from "@/lib/api/content";
import type { ContentAnalysis } from "@/lib/types/api";

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
        const response = await contentApi.analyzeContent(text);

        setState((prev) => ({
          ...prev,
          analysis: response.analysis,
          isAnalyzing: false,
        }));

        return response.analysis;
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
