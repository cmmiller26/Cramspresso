import { useState, useCallback, useRef } from "react";

export interface ProgressState {
  current: number;
  total: number;
  stage: string;
  percentage: number;
  isComplete: boolean;
  startTime?: Date;
  estimatedTimeRemaining?: number | null; // in milliseconds
}

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  weight: number; // Relative weight for progress calculation (0-1)
}

interface UseProgressTrackerReturn {
  progress: ProgressState;
  updateProgress: (current: number, total?: number, stage?: string) => void;
  setStage: (stage: string) => void;
  setSteps: (steps: ProgressStep[]) => void;
  completeStep: (stepId: string) => void;
  resetProgress: () => void;
  getCurrentStep: () => ProgressStep | null;
  getNextStep: () => ProgressStep | null;
  calculateETA: () => number | null;
}

/**
 * Centralized progress tracking hook for long-running operations
 * Used for generation, bulk improvements, and other multi-step processes
 *
 * @param initialTotal - Initial total for progress calculation
 * @returns Object with progress state and management functions
 */
export function useProgressTracker(
  initialTotal: number = 100
): UseProgressTrackerReturn {
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: initialTotal,
    stage: "",
    percentage: 0,
    isComplete: false,
    startTime: undefined,
    estimatedTimeRemaining: null,
  });

  const [steps, setStepsState] = useState<ProgressStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Use refs for timing calculations to avoid dependency issues
  const startTimeRef = useRef<Date | null>(null);
  const stepTimingsRef = useRef<Map<string, number>>(new Map());

  // Helper function to calculate time remaining - pure function, no deps needed
  const getTimeRemaining = (
    current: number,
    total: number,
    startTime: Date | null
  ): number | null => {
    if (!startTime || current === 0) return null;

    const elapsed = Date.now() - startTime.getTime();
    const rate = current / elapsed; // progress per millisecond
    const remaining = total - current;

    return rate > 0 ? remaining / rate : null;
  };

  const updateProgress = useCallback(
    (current: number, total?: number, stage?: string) => {
      setProgress((prev) => {
        const newTotal = total ?? prev.total;
        const newCurrent = Math.min(current, newTotal);
        const newPercentage =
          newTotal > 0 ? Math.round((newCurrent / newTotal) * 100) : 0;
        const isComplete = newCurrent >= newTotal;

        // Start timing if this is the first progress update
        if (newCurrent > 0 && !startTimeRef.current) {
          startTimeRef.current = new Date();
        }

        const estimatedTimeRemaining = getTimeRemaining(
          newCurrent,
          newTotal,
          startTimeRef.current
        );

        return {
          ...prev,
          current: newCurrent,
          total: newTotal,
          stage: stage ?? prev.stage,
          percentage: newPercentage,
          isComplete,
          startTime: startTimeRef.current || prev.startTime,
          estimatedTimeRemaining,
        };
      });
    },
    []
  ); // Empty deps - only uses function parameters and refs

  const setStage = useCallback((stage: string) => {
    setProgress((prev) => ({ ...prev, stage }));
  }, []);

  const setSteps = useCallback((newSteps: ProgressStep[]) => {
    setStepsState(newSteps);
    setCompletedSteps(new Set());
    stepTimingsRef.current.clear();
  }, []);

  const completeStep = useCallback((stepId: string) => {
    // Record timing for this step
    stepTimingsRef.current.set(stepId, Date.now());

    setCompletedSteps((prev) => {
      const newCompleted = new Set([...prev, stepId]);

      // Find the step and calculate progress
      setStepsState((currentSteps) => {
        const step = currentSteps.find((s) => s.id === stepId);
        if (!step) return currentSteps;

        // Calculate progress based on completed steps
        const completedWeight = currentSteps
          .filter((s) => newCompleted.has(s.id))
          .reduce((sum, s) => sum + s.weight, 0);

        const totalWeight = currentSteps.reduce((sum, s) => sum + s.weight, 0);
        const progressPercentage =
          totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

        // Update progress directly within the callback
        setProgress((prevProgress) => {
          const estimatedTimeRemaining = getTimeRemaining(
            progressPercentage,
            100,
            startTimeRef.current
          );

          return {
            ...prevProgress,
            current: progressPercentage,
            total: 100,
            stage: step.label,
            percentage: Math.round(progressPercentage),
            isComplete: progressPercentage >= 100,
            estimatedTimeRemaining,
          };
        });

        return currentSteps;
      });

      return newCompleted;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      current: 0,
      total: initialTotal,
      stage: "",
      percentage: 0,
      isComplete: false,
      startTime: undefined,
      estimatedTimeRemaining: null,
    });
    setCompletedSteps(new Set());
    startTimeRef.current = null;
    stepTimingsRef.current.clear();
  }, [initialTotal]);

  const getCurrentStep = useCallback((): ProgressStep | null => {
    return steps.find((step) => !completedSteps.has(step.id)) || null;
  }, [steps, completedSteps]);

  const getNextStep = useCallback((): ProgressStep | null => {
    const currentIndex = steps.findIndex(
      (step) => !completedSteps.has(step.id)
    );
    return steps[currentIndex + 1] || null;
  }, [steps, completedSteps]);

  const calculateETA = (): number | null => {
    return getTimeRemaining(
      progress.current,
      progress.total,
      startTimeRef.current
    );
  };

  return {
    progress,
    updateProgress,
    setStage,
    setSteps,
    completeStep,
    resetProgress,
    getCurrentStep,
    getNextStep,
    calculateETA,
  };
}

// Common progress step configurations for create flow operations
export const GENERATION_STEPS: ProgressStep[] = [
  {
    id: "analyzing",
    label: "Analyzing Content",
    description: "AI is understanding your content structure and key concepts",
    weight: 0.25,
  },
  {
    id: "planning",
    label: "Planning Strategy",
    description: "Determining optimal question types and difficulty levels",
    weight: 0.2,
  },
  {
    id: "generating",
    label: "Creating Flashcards",
    description: "Creating flashcards for key concepts and vocabulary",
    weight: 0.45,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Preparing your flashcards for review",
    weight: 0.1,
  },
];

export const BULK_IMPROVEMENT_STEPS: ProgressStep[] = [
  {
    id: "preparation",
    label: "Preparing Cards",
    description: "Organizing selected cards for improvement",
    weight: 0.1,
  },
  {
    id: "analyzing",
    label: "Analyzing Content",
    description: "Understanding improvement requirements",
    weight: 0.2,
  },
  {
    id: "improving",
    label: "Applying Improvements",
    description: "AI is enhancing your flashcards",
    weight: 0.6,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Completing improvements",
    weight: 0.1,
  },
];

// Utility function to format time remaining
export function formatTimeRemaining(milliseconds: number | null): string {
  if (!milliseconds || milliseconds <= 0) return "";

  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s remaining`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours}h remaining`;
  }
}
