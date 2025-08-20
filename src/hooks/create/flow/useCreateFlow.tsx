import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { useGenerationProgress } from "@/hooks/create/flow/useGenerationProgress";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";
import { extractTextFromFile } from "@/lib/api/content";
import type {
  ContentAnalysis,
  CreateFlowState,
  UseCreateFlowReturn,
} from "@/lib/types/create";

/**
 * Main coordinating hook for the create flow
 * Manages state across all create flow steps and coordinates between components
 */
export function useCreateFlow(): UseCreateFlowReturn {
  const router = useRouter();

  const { setLoading } = useLoadingState([
    "file-upload",
    "text-extraction",
    "generation",
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
      error: undefined, // Clear any previous errors
    }));

    setLoading("generation", true);
    clearError();

    try {
      // Generate cards (includes analysis step now or reuses existing analysis)
      const result = await generateFlashcards(text, analysisToReuse);

      // Store the analysis for potential retries
      setState((prev) => ({ ...prev, lastAnalysis: result.analysis }));

      // Save to session storage for review page with analysis
      CardsSessionStorage.save(result.cards, text, result.analysis);

      setState((prev) => ({ ...prev, step: "complete" }));
      setLoading("generation", false);

      // Redirect to review after brief success display
      setTimeout(() => {
        router.push("/create/review");
      }, 2000);
    } catch (error) {
      setLoading("generation", false);

      // Handle cancellation gracefully - show success message
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

    clearError();
    CardsSessionStorage.clear();
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
    handleFileUploaded,
    handleTextInput,
    handleStartOver,
    handleRetryGeneration,
    handleUploadCancelled,
    handleCancelGeneration: cancelGeneration,
    clearError,
  };
}
