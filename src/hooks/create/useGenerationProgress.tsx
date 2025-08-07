import { useState, useCallback, useRef } from "react";
import * as flashcardsApi from "@/lib/api/flashcards";
import * as contentApi from "@/lib/api/content";
import type { ContentAnalysis, GeneratedCard } from "@/lib/types/api";

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
    description: "AI is understanding your content structure and key concepts",
    duration: 2500,
    endProgress: 25,
  },
  {
    id: "planning",
    label: "Planning Strategy",
    description: "Determining optimal question types and difficulty levels",
    duration: 1500,
    endProgress: 45,
  },
  {
    id: "generating",
    label: "Creating Flashcards",
    description: "Creating flashcards for key concepts and vocabulary",
    duration: 4000,
    endProgress: 90,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Preparing your flashcards for review",
    duration: 1000,
    endProgress: 100,
  },
];

interface GenerationState {
  isGenerating: boolean;
  currentStage: number;
  progress: number;
  error?: string;
  canCancel: boolean;
  currentStageDescription: string;
  generatedCards: GeneratedCard[];
  contentType?: string;
  contentHint?: string; // e.g., "15 vocabulary terms" or "3 key concepts"
}

interface GenerationContext {
  abortController: AbortController | null;
  isAborted: boolean;
}

// Easing function for natural progress animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Helper function to generate content hint
function generateContentHint(analysis: ContentAnalysis): string {
  if (analysis.contentType === "vocabulary" && analysis.vocabularyTerms.length > 0) {
    return `${analysis.vocabularyTerms.length} vocabulary terms`;
  } else if (analysis.keyTopics.length > 0) {
    return `${analysis.keyTopics.length} key concepts`;
  } else {
    return "key content";
  }
}

export function useGenerationProgress() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    currentStage: 0,
    progress: 0,
    canCancel: true,
    currentStageDescription: "",
    generatedCards: [],
    contentType: undefined,
    contentHint: undefined,
  });

  // Track the current generation context
  const [context, setContext] = useState<GenerationContext>({
    abortController: null,
    isAborted: false,
  });

  // Use ref for immediate access to context in animations
  const contextRef = useRef<GenerationContext>(context);
  contextRef.current = context;

  const animateProgress = useCallback(
    (
      startProgress: number,
      endProgress: number,
      duration: number,
      contextRef: React.MutableRefObject<GenerationContext>
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const progressDiff = endProgress - startProgress;

        const updateProgress = () => {
          // Check if generation was aborted using the ref for immediate updates
          if (contextRef.current.isAborted) {
            console.log("🚫 Animation cancelled due to abort");
            reject(new Error("Generation cancelled"));
            return;
          }

          const elapsed = Date.now() - startTime;
          const progressRatio = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutCubic(progressRatio);
          const currentProgress = startProgress + progressDiff * easedProgress;

          setState((prev) => ({
            ...prev,
            progress: currentProgress,
          }));

          if (progressRatio < 1) {
            requestAnimationFrame(updateProgress);
          } else {
            resolve();
          }
        };

        updateProgress();
      });
    },
    []
  );

  const generateFlashcards = useCallback(
    async (
      text: string,
      analysis?: ContentAnalysis // Make analysis optional so we can generate it internally
    ): Promise<{ cards: GeneratedCard[]; analysis: ContentAnalysis }> => {
      console.log(
        "🚀 useGenerationProgress: Starting integrated generation process",
        {
          textLength: text.length,
          hasAnalysis: !!analysis,
          contentType: analysis?.contentType,
          approach: analysis?.contentGuidance?.approach,
          keyTopics: analysis?.keyTopics?.length,
          vocabularyTerms: analysis?.vocabularyTerms?.length,
        }
      );

      // Create new AbortController for this generation
      const abortController = new AbortController();

      setContext({
        abortController,
        isAborted: false,
      });

      setState({
        isGenerating: true,
        currentStage: 0,
        progress: 0,
        canCancel: true,
        currentStageDescription: GENERATION_STAGES[0].description,
        generatedCards: [],
        error: undefined,
        contentType: analysis?.contentType,
        contentHint: analysis ? generateContentHint(analysis) : undefined,
      });

      try {
        let finalAnalysis = analysis;

        // Stage 1: Analysis (run analysis if not provided)
        if (!finalAnalysis) {
          console.log("📋 Stage 1: Running content analysis");
          setState((prev) => ({
            ...prev,
            currentStageDescription: GENERATION_STAGES[0].description,
          }));

          // Start progress animation and analysis concurrently
          const progressPromise = animateProgress(
            0,
            GENERATION_STAGES[0].endProgress,
            GENERATION_STAGES[0].duration,
            contextRef
          );

          const analysisPromise = contentApi.analyzeContent(
            text,
            abortController.signal
          );

          const [, analysisResult] = await Promise.all([
            progressPromise,
            analysisPromise,
          ]);
          finalAnalysis = analysisResult.analysis;

          // Update state with analysis results
          setState((prev) => ({
            ...prev,
            contentType: finalAnalysis?.contentType,
            contentHint: finalAnalysis ? generateContentHint(finalAnalysis) : undefined,
          }));

          console.log("✅ Content analysis completed", {
            contentType: finalAnalysis?.contentType,
            approach: finalAnalysis?.contentGuidance?.approach,
            expectedRange: finalAnalysis?.contentGuidance?.expectedRange,
            vocabularyTerms: finalAnalysis?.vocabularyTerms?.length || 0,
            keyTopics: finalAnalysis?.keyTopics?.length || 0,
          });
        } else {
          console.log("📋 Stage 1: Using pre-computed analysis");
          setState((prev) => ({
            ...prev,
            currentStageDescription: GENERATION_STAGES[0].description,
          }));

          await animateProgress(
            0,
            GENERATION_STAGES[0].endProgress,
            GENERATION_STAGES[0].duration,
            contextRef
          );
        }

        // Check if aborted using ref for immediate detection
        if (contextRef.current.isAborted) {
          throw new Error("Generation cancelled");
        }

        // Stage 2: Planning Strategy
        console.log("🎯 Stage 2: Planning flashcard strategy");
        setState((prev) => ({
          ...prev,
          currentStage: 1,
          currentStageDescription: GENERATION_STAGES[1].description,
        }));

        await animateProgress(
          GENERATION_STAGES[0].endProgress,
          GENERATION_STAGES[1].endProgress,
          GENERATION_STAGES[1].duration,
          contextRef
        );

        // Check if aborted using ref for immediate detection
        if (contextRef.current.isAborted) {
          throw new Error("Generation cancelled");
        }

        // Stage 3: Generate cards (actual API call)
        console.log("⚡ Stage 3: Starting API call for card generation");
        setState((prev) => ({
          ...prev,
          currentStage: 2,
          currentStageDescription: GENERATION_STAGES[2].description,
        }));

        // Start progress animation and API call concurrently
        const progressPromise = animateProgress(
          GENERATION_STAGES[1].endProgress,
          GENERATION_STAGES[2].endProgress,
          GENERATION_STAGES[2].duration,
          contextRef
        );

        console.log("📡 Calling flashcardsApi.generateCards...");

        // Pass the abort signal to the API call
        const apiPromise = flashcardsApi.generateCards(
          text,
          finalAnalysis,
          abortController.signal
        );

        const [, cards] = await Promise.all([progressPromise, apiPromise]);

        // Check if aborted after API call using ref for immediate detection
        if (contextRef.current.isAborted) {
          throw new Error("Generation cancelled");
        }

        console.log("✅ API call completed successfully", {
          cardsReceived: cards.length,
          contentType: finalAnalysis?.contentType,
          approach: finalAnalysis?.contentGuidance?.approach,
          sampleCard: cards[0]
            ? {
                hasId: "id" in cards[0],
                questionLength: cards[0].question?.length,
                answerLength: cards[0].answer?.length,
              }
            : null,
        });

        // Convert API response to our format
        const generatedCards: GeneratedCard[] = cards.map((card, index) => {
          const cardWithId = {
            id: card.id || `generated-${Date.now()}-${index}`,
            question: card.question,
            answer: card.answer,
          };

          console.log(`📄 Card ${index + 1}:`, {
            id: cardWithId.id,
            questionPreview: cardWithId.question.substring(0, 50) + "...",
            answerPreview: cardWithId.answer.substring(0, 50) + "...",
          });

          return cardWithId;
        });

        console.log("📊 Generation results:", {
          cardsGenerated: generatedCards.length,
          contentType: finalAnalysis?.contentType,
          approach: finalAnalysis?.contentGuidance?.approach, 
          expectedRange: finalAnalysis?.contentGuidance?.expectedRange,
        });

        // Stage 4: Finalization
        console.log("🎯 Stage 4: Finalization");
        setState((prev) => ({
          ...prev,
          currentStage: 3,
          currentStageDescription: GENERATION_STAGES[3].description,
          generatedCards,
        }));

        await animateProgress(
          GENERATION_STAGES[2].endProgress,
          GENERATION_STAGES[3].endProgress,
          GENERATION_STAGES[3].duration,
          contextRef
        );

        // Final check if aborted using ref for immediate detection
        if (contextRef.current.isAborted) {
          throw new Error("Generation cancelled");
        }

        // Complete
        console.log("🎉 Generation completed successfully", {
          totalCards: generatedCards.length,
          contentType: finalAnalysis?.contentType,
          approach: finalAnalysis?.contentGuidance?.approach,
          finalState: "complete",
        });

        setState((prev) => ({
          ...prev,
          isGenerating: false,
          progress: 100,
        }));

        // Clear the context
        setContext({
          abortController: null,
          isAborted: false,
        });

        return { cards: generatedCards, analysis: finalAnalysis };
      } catch (error) {
        // Handle cancelled generation gracefully
        if (
          contextRef.current.isAborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          console.log("🔄 Generation cancelled successfully");

          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: undefined, // Don't show cancellation as an error
          }));

          // Clear the context
          setContext({
            abortController: null,
            isAborted: false,
          });

          // Throw a specific cancellation error that the parent can handle
          const cancelError = new Error("Generation cancelled by user");
          cancelError.name = "CancellationError";
          throw cancelError;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Generation failed";

        console.error("❌ Generation failed:", {
          error: errorMessage,
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          stage: state.currentStage,
          progress: state.progress,
          wasAborted: contextRef.current.isAborted,
        });

        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));

        // Clear the context
        setContext({
          abortController: null,
          isAborted: false,
        });

        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animateProgress]
  );

  const cancelGeneration = useCallback(() => {
    console.log("⏹️ Generation cancelled by user");

    // Get the current abort controller from context
    setContext((prevContext) => {
      // Abort the current request if it exists
      if (prevContext.abortController) {
        console.log("🚫 Aborting current generation request");
        prevContext.abortController.abort();
      }

      // Return updated context with abort flag
      return {
        ...prevContext,
        isAborted: true,
      };
    });

    // Immediately update state to show cancellation is in progress
    setState((prev) => ({
      ...prev,
      canCancel: false, // Temporarily disable to prevent double-clicks
    }));

    console.log("✅ Cancel request processed");
  }, []); // Remove dependencies to make it more responsive

  const clearError = useCallback(() => {
    console.log("🧹 Clearing generation error");
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  return {
    state,
    generateFlashcards,
    cancelGeneration,
    clearError,
  };
}
