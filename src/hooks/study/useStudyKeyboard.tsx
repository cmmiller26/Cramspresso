import { useEffect, useCallback } from "react";

interface UseStudyKeyboardProps {
  showAnswer: boolean;
  currentIndex: number;
  isLoading?: boolean; // ✅ ADD: Disable during loading
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onToggleHelp: () => void;
}

export function useStudyKeyboard({
  showAnswer,
  currentIndex,
  isLoading = false, // ✅ NEW
  onShowAnswer,
  onNext,
  onPrevious,
  onShuffle,
  onToggleHelp,
}: UseStudyKeyboardProps) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // ✅ IMPROVED: Don't handle keys during loading
      if (isLoading) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't interfere with form inputs
      }

      switch (event.code) {
        case "Space":
        case "Enter": // ✅ ADD: Enter key as alternative
          event.preventDefault();
          if (!showAnswer) {
            onShowAnswer();
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (!showAnswer) {
            onNext(); // Skip only before showing answer
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (currentIndex > 0) {
            onPrevious();
          }
          break;
        case "KeyY":
          event.preventDefault();
          if (showAnswer) {
            onNext(true);
          }
          break;
        case "KeyN":
          event.preventDefault();
          if (showAnswer) {
            onNext(false);
          }
          break;
        case "KeyS":
          event.preventDefault();
          onShuffle();
          break;
        case "KeyH":
        case "F1":
        case "Slash": // ✅ ADD: ? key for help
          event.preventDefault();
          onToggleHelp();
          break;
        // ✅ ADD: Escape to close help
        case "Escape":
          event.preventDefault();
          onToggleHelp(); // This will close help if open
          break;
      }
    },
    [
      showAnswer,
      currentIndex,
      isLoading, // ✅ ADD to dependencies
      onShowAnswer,
      onNext,
      onPrevious,
      onShuffle,
      onToggleHelp,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);
}
