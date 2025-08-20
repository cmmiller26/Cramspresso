import { useState, useCallback } from "react";

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingStateReturn {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAllLoading: () => void;
  getLoadingKeys: () => string[];
}

/**
 * Centralized loading state management hook
 * Replaces manual loading state management across the create flow
 *
 * @param initialStates - Array of loading state keys to initialize
 * @returns Object with loading state management functions
 */
export function useLoadingState(
  initialStates: string[] = []
): UseLoadingStateReturn {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => {
    const initial: LoadingState = {};
    initialStates.forEach((key) => {
      initial[key] = false;
    });
    return initial;
  });

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback(
    (key: string): boolean => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some((loading) => loading);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates((prev) => {
      const cleared: LoadingState = {};
      Object.keys(prev).forEach((key) => {
        cleared[key] = false;
      });
      return cleared;
    });
  }, []);

  const getLoadingKeys = useCallback((): string[] => {
    return Object.keys(loadingStates).filter((key) => loadingStates[key]);
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearAllLoading,
    getLoadingKeys,
  };
}

// Common loading state keys used throughout the application
export const LOADING_STATES = {
  // Create flow
  GENERATION: "generation",
  EXTRACTION: "extraction",
  ANALYSIS: "analysis",
  CARD_REFINEMENT: "card_refinement",
  BULK_IMPROVEMENTS: "bulk_improvements",
  AI_SUGGESTIONS: "ai_suggestions",
  SAVING: "saving",
  UPLOADING: "uploading",
  DELETING: "deleting",
  // Dashboard
  DASHBOARD_INIT: "dashboard_init",
  SETS_FETCH: "sets_fetch",
  SET_CREATE: "set_create",
} as const;

export type LoadingStateKey =
  (typeof LOADING_STATES)[keyof typeof LOADING_STATES];
