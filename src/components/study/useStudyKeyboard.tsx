import { useEffect, useCallback } from "react";

interface UseStudyKeyboardProps {
  showAnswer: boolean;
  currentIndex: number;
  onShowAnswer: () => void;
  onNext: (gotItRight?: boolean) => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onRestart: () => void;
  onToggleHelp: () => void;
}

export function useStudyKeyboard({
  showAnswer,
  currentIndex,
  onShowAnswer,
  onNext,
  onPrevious,
  onShuffle,
  onRestart,
  onToggleHelp,
}: UseStudyKeyboardProps) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't interfere with form inputs
      }

      switch (event.code) {
        case "Space":
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
        case "KeyR":
          event.preventDefault();
          onRestart();
          break;
        case "KeyH":
        case "F1":
          event.preventDefault();
          onToggleHelp();
          break;
      }
    },
    [
      showAnswer,
      currentIndex,
      onShowAnswer,
      onNext,
      onPrevious,
      onShuffle,
      onRestart,
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
