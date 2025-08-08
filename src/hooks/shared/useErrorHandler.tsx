import { useState, useCallback } from "react";
import {
  ErrorState,
  GenerationError,
  ReviewPageError,
  CardRefinementError,
  BulkImprovementsError,
  AISuggestionsError,
  FileUploadError,
  FileUploadWarning,
  CancellationSuccess,
} from "@/components/shared/ErrorStates";

export type ErrorType =
  | "GENERATION_ERROR"
  | "REFINEMENT_ERROR"
  | "BULK_ERROR"
  | "UPLOAD_ERROR"
  | "REVIEW_PAGE_ERROR"
  | "AI_SUGGESTIONS_ERROR"
  | "UPLOAD_WARNING"
  | "CANCELLATION_SUCCESS"
  | "GENERIC_ERROR";

interface ErrorHandlerState {
  type: ErrorType | null;
  message: string | null;
  retryAction?: () => void | Promise<void>;
  dismissAction?: () => void;
  goBackAction?: () => void;
  startOverAction?: () => void;
}

interface UseErrorHandlerReturn {
  error: ErrorHandlerState;
  showError: (
    type: ErrorType,
    message: string,
    actions?: {
      onRetry?: () => void | Promise<void>;
      onDismiss?: () => void;
      onGoBack?: () => void;
      onStartOver?: () => void;
    }
  ) => void;
  clearError: () => void;
  hasError: boolean;
  renderError: () => React.ReactElement | null;
}

/**
 * Centralized error handling hook that integrates with ErrorStates components
 * Provides consistent error display and handling patterns across the create flow
 *
 * @returns Object with error state management and rendering functions
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorHandlerState>({
    type: null,
    message: null,
  });

  const showError = useCallback(
    (
      type: ErrorType,
      message: string,
      actions?: {
        onRetry?: () => void | Promise<void>;
        onDismiss?: () => void;
        onGoBack?: () => void;
        onStartOver?: () => void;
      }
    ) => {
      setError({
        type,
        message,
        retryAction: actions?.onRetry,
        dismissAction: actions?.onDismiss,
        goBackAction: actions?.onGoBack,
        startOverAction: actions?.onStartOver,
      });
    },
    []
  );

  const clearError = useCallback(() => {
    setError({
      type: null,
      message: null,
    });
  }, []);

  const hasError = error.type !== null;

  const renderError = useCallback((): React.ReactElement | null => {
    if (!error.type || !error.message) {
      return null;
    }

    const commonProps = {
      error: error.message,
      onRetry: error.retryAction,
      onDismiss: error.dismissAction || clearError,
    };

    switch (error.type) {
      case "GENERATION_ERROR":
        return (
          <GenerationError
            {...commonProps}
            onStartOver={error.startOverAction}
          />
        );

      case "REFINEMENT_ERROR":
        return <CardRefinementError {...commonProps} />;

      case "BULK_ERROR":
        return <BulkImprovementsError {...commonProps} />;

      case "AI_SUGGESTIONS_ERROR":
        return <AISuggestionsError {...commonProps} />;

      case "UPLOAD_ERROR":
        return (
          <FileUploadError
            error={error.message}
            onRetry={error.retryAction}
            onClear={error.dismissAction || clearError}
          />
        );

      case "UPLOAD_WARNING":
        return (
          <FileUploadWarning
            message={error.message}
            onClear={error.dismissAction || clearError}
          />
        );

      case "CANCELLATION_SUCCESS":
        return (
          <CancellationSuccess
            message={error.message}
            onClear={error.dismissAction || clearError}
          />
        );

      case "REVIEW_PAGE_ERROR":
        return (
          <ReviewPageError
            error={error.message}
            onRetry={error.retryAction}
            onGoBack={error.goBackAction}
          />
        );

      case "GENERIC_ERROR":
      default:
        return (
          <ErrorState
            title="Something went wrong"
            message={error.message}
            onRetry={error.retryAction}
            showRetry={!!error.retryAction}
          />
        );
    }
  }, [error, clearError]);

  return {
    error,
    showError,
    clearError,
    hasError,
    renderError,
  };
}

// Error message helpers for common scenarios
export const ERROR_MESSAGES = {
  GENERATION_FAILED: "Failed to generate flashcards. Please try again.",
  REFINEMENT_FAILED: "Failed to improve card. Please try again.",
  BULK_IMPROVEMENT_FAILED:
    "Failed to apply bulk improvements. Please try again.",
  AI_SUGGESTIONS_FAILED: "Failed to generate AI suggestions. Please try again.",
  UPLOAD_FAILED: "Failed to upload file. Please check the file and try again.",
  SAVE_FAILED: "Failed to save flashcard set. Please try again.",
  LOAD_FAILED: "Failed to load data. Please refresh and try again.",
  VALIDATION_FAILED: "Please check your input and try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You do not have permission to perform this action.",
  CANCELLATION_SUCCESS: "Operation cancelled successfully. You can start over.",
  UPLOAD_WARNING: "Upload was cancelled or interrupted.",
} as const;
