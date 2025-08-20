import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";
import { createSet } from "@/lib/api/sets";
import type { CreateFlashcard } from "@/lib/types/flashcards";

interface SetSavingState {
  isDialogOpen: boolean;
  setName: string;
  isValidating: boolean;
  saveProgress: number;
}

interface UseSetSavingReturn {
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  setName: string;
  setSetName: (name: string) => void;
  saveProgress: number;
  validateSetName: (name: string) => Promise<boolean>;
  saveSet: (name: string, cards: CreateFlashcard[]) => Promise<string>;
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Set saving and metadata management hook
 * Extracted from useReviewCards to provide focused set saving functionality
 * Handles name validation, saving progress, and session storage cleanup
 */
export function useSetSaving(): UseSetSavingReturn {
  const router = useRouter();
  const { setLoading, isLoading: checkLoading } = useLoadingState([
    "save-set",
    "validate-name",
  ]);
  const { showError, clearError, hasError } = useErrorHandler();

  const [state, setState] = useState<SetSavingState>({
    isDialogOpen: false,
    setName: "",
    isValidating: false,
    saveProgress: 0,
  });

  const setDialogOpen = useCallback(
    (open: boolean): void => {
      setState((prev) => ({
        ...prev,
        isDialogOpen: open,
        // Reset form when opening
        setName: open ? "" : prev.setName,
        saveProgress: open ? 0 : prev.saveProgress,
      }));

      if (!open) {
        clearError();
      }
    },
    [clearError]
  );

  const setSetName = useCallback((name: string): void => {
    setState((prev) => ({
      ...prev,
      setName: name,
    }));
  }, []);

  const validateSetName = useCallback(
    async (name: string): Promise<boolean> => {
      console.log("🔍 DEBUG: Validating set name", { name });

      if (!name.trim()) {
        showError("REVIEW_PAGE_ERROR", "Set name is required");
        return false;
      }

      if (name.length < 3) {
        showError(
          "REVIEW_PAGE_ERROR",
          "Set name must be at least 3 characters long"
        );
        return false;
      }

      if (name.length > 100) {
        showError(
          "REVIEW_PAGE_ERROR",
          "Set name must be less than 100 characters"
        );
        return false;
      }

      setLoading("validate-name", true);
      setState((prev) => ({ ...prev, isValidating: true }));

      try {
        // Simulate name validation check
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Basic validation rules
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
          showError(
            "REVIEW_PAGE_ERROR",
            "Set name contains invalid characters"
          );
          return false;
        }

        // Check for reserved names
        const reservedNames = [
          "con",
          "prn",
          "aux",
          "nul",
          "com1",
          "com2",
          "lpt1",
          "lpt2",
        ];
        if (reservedNames.includes(name.toLowerCase())) {
          showError(
            "REVIEW_PAGE_ERROR",
            "This name is reserved. Please choose a different name"
          );
          return false;
        }

        console.log("✅ DEBUG: Set name validation passed", { name });
        clearError();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to validate set name";
        showError("REVIEW_PAGE_ERROR", errorMessage, {
          onRetry: () => {
            validateSetName(name);
          }, // Wrap in void function
        });
        return false;
      } finally {
        setLoading("validate-name", false);
        setState((prev) => ({ ...prev, isValidating: false }));
      }
    },
    [setLoading, showError, clearError]
  );

  const saveSet = useCallback(
    async (name: string, cards: CreateFlashcard[]): Promise<string> => {
      console.log("🔍 DEBUG: Starting set save", {
        name,
        cardCount: cards.length,
      });

      // Validate inputs
      if (!name.trim()) {
        showError("REVIEW_PAGE_ERROR", "Set name is required");
        throw new Error("Set name is required");
      }

      if (cards.length === 0) {
        showError("REVIEW_PAGE_ERROR", "Cannot save empty flashcard set");
        throw new Error("Cannot save empty flashcard set");
      }

      // Validate name first
      const isValidName = await validateSetName(name);
      if (!isValidName) {
        throw new Error("Invalid set name");
      }

      setLoading("save-set", true);
      setState((prev) => ({ ...prev, saveProgress: 0 }));

      try {
        // Simulate save progress with multiple steps
        const progressSteps = [
          { progress: 20, message: "Validating cards..." },
          { progress: 40, message: "Preparing set data..." },
          { progress: 60, message: "Saving to database..." },
          { progress: 80, message: "Finalizing..." },
          { progress: 100, message: "Complete!" },
        ];

        for (const step of progressSteps) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setState((prev) => ({ ...prev, saveProgress: step.progress }));
          console.log(
            `📊 DEBUG: Save progress: ${step.progress}% - ${step.message}`
          );
        }

        // Validate cards before saving
        const validCards = cards.filter(
          (card) => card.question?.trim() && card.answer?.trim()
        );

        if (validCards.length !== cards.length) {
          console.warn(
            "⚠️ DEBUG: Some cards were filtered out due to missing content",
            {
              original: cards.length,
              valid: validCards.length,
            }
          );
        }

        if (validCards.length === 0) {
          throw new Error("No valid cards to save");
        }

        // Call API to save the set
        console.log("📡 DEBUG: Calling createSet API", {
          name,
          cardCount: validCards.length,
        });

        const result = await createSet(name, validCards);

        console.log("✅ DEBUG: Set saved successfully", {
          setId: result.setId,
          name,
          cardCount: validCards.length,
        });

        // Clear session storage after successful save
        CardsSessionStorage.clear();
        console.log("🧹 DEBUG: Session storage cleared");

        clearError();
        setState((prev) => ({ ...prev, saveProgress: 100 }));

        // Small delay to show completion before redirect
        setTimeout(() => {
          router.push(`/sets/${result.setId}`);
        }, 1000);

        return result.setId;
      } catch (error) {
        console.error("❌ DEBUG: Set save failed", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to save flashcard set";
        showError("REVIEW_PAGE_ERROR", errorMessage, {
          onRetry: () => {
            saveSet(name, cards);
          }, // Wrap in void function
        });

        setState((prev) => ({ ...prev, saveProgress: 0 }));
        throw error;
      } finally {
        setLoading("save-set", false);
      }
    },
    [validateSetName, setLoading, showError, clearError, router]
  );

  return {
    isDialogOpen: state.isDialogOpen,
    setDialogOpen,
    setName: state.setName,
    setSetName,
    saveProgress: state.saveProgress,
    validateSetName,
    saveSet,
    isLoading: checkLoading("save-set") || checkLoading("validate-name"),
    isSaving: checkLoading("save-set"),
    isValidating: state.isValidating,
    error: hasError ? "Set saving operation failed" : null,
    clearError,
  };
}
