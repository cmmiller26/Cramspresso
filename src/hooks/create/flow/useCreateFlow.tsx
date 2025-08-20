import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { useGenerationProgress } from "@/hooks/create/flow/useGenerationProgress";
import { extractTextFromFile } from "@/lib/api/content";
import { createSet } from "@/lib/api/sets";
import type {
  ContentAnalysis,
  CreateFlowState,
  PreviewState,
  UseCreateFlowReturn,
} from "@/lib/types/create";

/**
 * Simplified create flow hook for alpha release
 * Manages state across the simplified 3-step flow: upload → generate → preview
 */
export function useCreateFlow(): UseCreateFlowReturn {
  const router = useRouter();

  const { setLoading } = useLoadingState([
    "file-upload",
    "text-extraction",
    "generation",
    "saving",
  ]);

  const { showError, clearError, hasError } = useErrorHandler();

  const {
    state: generationState,
    generateFlashcards,
    cancelGeneration,
  } = useGenerationProgress();

  const [state, setState] = useState<CreateFlowState>({
    step: "upload",
    extractedText: "",
    source: "file",
    isExtracting: false,
    cancelledFileUrls: new Set(),
  });

  const [previewState, setPreviewState] = useState<PreviewState>({
    cards: [],
    analysis: null,
    setName: "",
    isSaving: false,
    saveProgress: 0,
    error: null,
    isAnalysisExpanded: false,
    savedSetId: undefined,
    showSuccessState: false,
  });

  // Handle file upload completion
  const handleFileUploaded = async (url: string, fileName: string) => {
    console.log("📁 handleFileUploaded called for:", fileName, "URL:", url);

    // Check if this file URL was cancelled
    if (state.cancelledFileUrls?.has(url)) {
      console.log("🚫 File upload was cancelled - ignoring:", url);
      return;
    }

    setState((prev) => ({
      ...prev,
      fileName,
      fileUrl: url,
      source: "file",
      isExtracting: true,
      error: undefined,
    }));

    setLoading("text-extraction", true);

    try {
      // Check again before text extraction in case cancellation happened during state update
      if (state.cancelledFileUrls?.has(url)) {
        console.log(
          "🚫 File upload cancelled during extraction setup - ignoring:",
          url
        );
        return;
      }

      // Use centralized API function
      const text = await extractTextFromFile(url);

      // Check one more time before proceeding to generation
      if (state.cancelledFileUrls?.has(url)) {
        console.log(
          "🚫 File upload cancelled after extraction - ignoring:",
          url
        );
        return;
      }

      setState((prev) => ({
        ...prev,
        extractedText: text,
        isExtracting: false,
      }));

      setLoading("text-extraction", false);

      // Automatically start generation (which includes analysis)
      await handleGenerateCards(text);
    } catch (error) {
      setLoading("text-extraction", false);

      // Don't show error if upload was cancelled
      if (state.cancelledFileUrls?.has(url)) {
        console.log(
          "🚫 File upload cancelled during error handling - ignoring:",
          url
        );
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to extract text";
      showError("UPLOAD_ERROR", errorMessage, {
        onRetry: () => handleFileUploaded(url, fileName),
        onDismiss: clearError,
      });

      setState((prev) => ({
        ...prev,
        isExtracting: false,
      }));
    }
  };

  const handleTextInput = async (text: string) => {
    setState((prev) => ({
      ...prev,
      extractedText: text,
      source: "text",
      fileName: undefined,
      fileUrl: undefined,
      error: undefined,
    }));

    // Automatically start generation (which includes analysis)
    await handleGenerateCards(text);
  };

  const handleGenerateCards = async (
    text: string,
    analysisToReuse?: ContentAnalysis
  ) => {
    setState((prev) => ({
      ...prev,
      step: "generating",
      error: undefined,
    }));

    setLoading("generation", true);
    clearError();

    try {
      // Generate cards (includes analysis step)
      const result = await generateFlashcards(text, analysisToReuse);

      // Store the analysis for potential retries
      setState((prev) => ({ ...prev, lastAnalysis: result.analysis }));

      // Move to preview step with generated cards and analysis
      setPreviewState({
        cards: result.cards,
        analysis: result.analysis,
        setName: "",
        isSaving: false,
        saveProgress: 0,
        error: null,
        isAnalysisExpanded: false,
        savedSetId: undefined,
        showSuccessState: false,
      });

      setState((prev) => ({ ...prev, step: "preview" }));
      setLoading("generation", false);
    } catch (error) {
      setLoading("generation", false);

      // Handle cancellation gracefully
      if (error instanceof Error && error.name === "CancellationError") {
        console.log("🔄 Generation was cancelled, returning to upload");
        setState((prev) => ({
          ...prev,
          step: "upload",
          error: undefined,
        }));

        showError(
          "CANCELLATION_SUCCESS",
          "Generation cancelled successfully. You can start over with new content.",
          {
            onDismiss: clearError,
          }
        );
        return;
      }

      // For other errors, stay on generation screen to allow retry
      console.error("❌ Generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";

      showError("GENERATION_ERROR", errorMessage, {
        onRetry: handleRetryGeneration,
        onStartOver: handleStartOver,
      });

      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  };

  const handleRetryGeneration = () => {
    clearError();
    // Retry using the same text and analysis if available
    handleGenerateCards(state.extractedText, state.lastAnalysis);
  };

  const handleSaveSet = async (setName: string) => {
    setPreviewState((prev) => ({
      ...prev,
      isSaving: true,
      saveProgress: 0,
      error: null,
    }));

    setLoading("saving", true);

    try {
      // Convert GeneratedCards to CreateFlashcard format for API
      const cardsForSaving = previewState.cards.map((card) => ({
        question: card.question,
        answer: card.answer,
      }));

      // Simulate progress updates
      setPreviewState((prev) => ({ ...prev, saveProgress: 25 }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setPreviewState((prev) => ({ ...prev, saveProgress: 50 }));
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setPreviewState((prev) => ({ ...prev, saveProgress: 75 }));

      // Save the set
      const result = await createSet(setName, cardsForSaving);

      setPreviewState((prev) => ({ 
        ...prev, 
        saveProgress: 100,
        isSaving: false,
        savedSetId: result.setId,
        showSuccessState: true,
      }));
      setLoading("saving", false);

      // Don't auto-redirect - show success state with options
    } catch (error) {
      setLoading("saving", false);
      
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save flashcard set";

      setPreviewState((prev) => ({
        ...prev,
        isSaving: false,
        saveProgress: 0,
        error: errorMessage,
      }));
    }
  };

  const handleStartOver = () => {
    setState({
      step: "upload",
      extractedText: "",
      source: "file",
      isExtracting: false,
      error: undefined,
      successMessage: undefined,
      lastAnalysis: undefined,
      cancelledFileUrls: new Set(),
    });

    setPreviewState({
      cards: [],
      analysis: null,
      setName: "",
      isSaving: false,
      saveProgress: 0,
      error: null,
      isAnalysisExpanded: false,
      savedSetId: undefined,
      showSuccessState: false,
    });

    clearError();
  };

  const handleToggleAnalysis = () => {
    setPreviewState((prev) => ({
      ...prev,
      isAnalysisExpanded: !prev.isAnalysisExpanded,
    }));
  };

  const handleNavigateToEdit = () => {
    if (previewState.savedSetId) {
      router.push(`/sets/${previewState.savedSetId}/edit`);
    }
  };

  const handleNavigateToStudy = () => {
    if (previewState.savedSetId) {
      router.push(`/study/${previewState.savedSetId}`);
    }
  };

  const handleUploadCancelled = (fileUrl?: string) => {
    console.log("🚫 Upload cancelled callback - File URL:", fileUrl);
    if (fileUrl) {
      setState((prev) => ({
        ...prev,
        cancelledFileUrls: new Set(prev.cancelledFileUrls).add(fileUrl),
      }));
    }
  };

  return {
    state: {
      ...state,
      error: state.error || (hasError ? "An error occurred" : undefined),
    },
    generationState,
    previewState,
    handleFileUploaded,
    handleTextInput,
    handleStartOver,
    handleRetryGeneration,
    handleUploadCancelled,
    handleCancelGeneration: cancelGeneration,
    handleSaveSet,
    handleToggleAnalysis,
    handleNavigateToEdit,
    handleNavigateToStudy,
    clearError,
  };
}
