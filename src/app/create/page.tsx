interface GenerationStage {
  id: string;
  label: string;
  description: string;
  duration: number; // milliseconds
  endProgress: number; // 0-100
}

const GENERATION_STAGES: GenerationStage[] = [
  {
    id: "analyzing",
    label: "Analyzing Content",
    description: "Reading and understanding your material structure",
    duration: 2000,
    endProgress: 20,
  },
  {
    id: "extracting",
    label: "Extracting Key Concepts",
    description: "Identifying important terms, definitions, and relationships",
    duration: 3000,
    endProgress: 45,
  },
  {
    id: "generating",
    label: "Generating Questions",
    description: "Creating targeted questions based on your content",
    duration: 4000,
    endProgress: 75,
  },
  {
    id: "formatting",
    label: "Formatting Cards",
    description: "Finalizing flashcards and preparing for review",
    duration: 1500,
    endProgress: 95,
  },
  {
    id: "complete",
    label: "Complete",
    description: "Your flashcards are ready!",
    duration: 500,
    endProgress: 100,
  },
];

interface GenerationState {
  isGenerating: boolean;
  currentStage: number; // index in GENERATION_STAGES
  progress: number; // 0-100
  error?: string;
  canCancel: boolean;
  estimatedCards: number;
  wordsProcessed: number;
  totalWords: number;
}

// Enhanced generation progress hook
export function useGenerationProgress() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    currentStage: 0,
    progress: 0,
    error: undefined,
    canCancel: true,
    estimatedCards: 0,
    wordsProcessed: 0,
    totalWords: 0,
  });

  const startGeneration = useCallback(
    (text: string, config: GenerationConfig) => {
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const estimatedCards = Math.max(1, Math.floor(words.length / 50));

      setState({
        isGenerating: true,
        currentStage: 0,
        progress: 0,
        error: undefined,
        canCancel: true,
        estimatedCards,
        wordsProcessed: 0,
        totalWords: words.length,
      });

      return runGenerationStages(text, config, estimatedCards, words.length);
    },
    []
  );

  const cancelGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      canCancel: false,
      error: "Generation cancelled by user",
    }));
  }, []);

  const runGenerationStages = async (
    text: string,
    config: GenerationConfig,
    estimatedCards: number,
    totalWords: number
  ) => {
    try {
      // Run through each stage with realistic progress
      for (
        let stageIndex = 0;
        stageIndex < GENERATION_STAGES.length - 1;
        stageIndex++
      ) {
        const stage = GENERATION_STAGES[stageIndex];
        const nextStage = GENERATION_STAGES[stageIndex + 1];

        // Update current stage
        setState((prev) => ({ ...prev, currentStage: stageIndex }));

        // Animate progress within the stage
        await animateProgress(
          stage.endProgress,
          nextStage.endProgress,
          stage.duration,
          totalWords,
          stageIndex
        );
      }

      // Make the actual API call
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const { cards } = await response.json();

      // Final completion stage
      setState((prev) => ({
        ...prev,
        currentStage: GENERATION_STAGES.length - 1,
        progress: 100,
        isGenerating: false,
        estimatedCards: cards.length,
      }));

      return cards;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : "Generation failed",
      }));
      throw error;
    }
  };

  const animateProgress = (
    startProgress: number,
    endProgress: number,
    duration: number,
    totalWords: number,
    stageIndex: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const progressDiff = endProgress - startProgress;

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);

        // Use easing function for more natural progress
        const easedProgress = easeOutCubic(progressRatio);
        const currentProgress = startProgress + progressDiff * easedProgress;

        // Simulate words processed
        const wordsProcessed = Math.floor((totalWords * currentProgress) / 100);

        setState((prev) => ({
          ...prev,
          progress: currentProgress,
          wordsProcessed,
        }));

        if (progressRatio < 1) {
          requestAnimationFrame(updateProgress);
        } else {
          resolve();
        }
      };

      updateProgress();
    });
  };

  return { state, startGeneration, cancelGeneration };
}

// Easing function for natural progress animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Enhanced generation progress component
interface GenerationProgressProps {
  state: GenerationState;
  onCancel: () => void;
}

export function GenerationProgress({
  state,
  onCancel,
}: GenerationProgressProps) {
  const currentStage = GENERATION_STAGES[state.currentStage];
  const isLastStage = state.currentStage === GENERATION_STAGES.length - 1;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary animate-pulse" />
              <h3 className="font-semibold text-foreground">
                Generating Flashcards
              </h3>
            </div>
            {state.canCancel && !isLastStage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                {currentStage.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(state.progress)}%
              </span>
            </div>
            <Progress value={state.progress} className="h-3" />
          </div>

          {/* Current Stage Details */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                {currentStage.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {state.wordsProcessed.toLocaleString()} /{" "}
                  {state.totalWords.toLocaleString()} words
                </span>
                <span>~{state.estimatedCards} cards expected</span>
              </div>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Progress Timeline
            </h4>
            <div className="space-y-2">
              {GENERATION_STAGES.slice(0, -1).map((stage, index) => {
                const isCompleted = index < state.currentStage;
                const isCurrent = index === state.currentStage;

                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                        ${
                          isCompleted
                            ? "bg-green-100 text-green-700 border-2 border-green-300"
                            : isCurrent
                            ? "bg-primary/10 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground border-2 border-muted"
                        }
                      `}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          isCompleted || isCurrent
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Tips */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">
              🤖 AI Generation Tips
            </h4>
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing your content structure and creating questions
              that test comprehension, recall, and application. Each card is
              crafted to maximize your learning effectiveness.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
