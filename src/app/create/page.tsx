"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GenerationError,
  CancellationSuccess,
} from "@/components/shared/ErrorStates";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { FileUploader } from "@/components/create/FileUploader";
import {
  Upload,
  Brain,
  CheckCircle,
  ArrowLeft,
  Zap,
  FileText,
} from "lucide-react";
import { useContentAnalysis } from "@/hooks/create/useContentAnalysis";
import { useGenerationProgress } from "@/hooks/create/useGenerationProgress";
import { CardsSessionStorage } from "@/lib/storage/CardsSessionStorage";
import { extractTextFromFile } from "@/lib/api/content";
import type { ContentAnalysis } from "@/lib/types/api";

type FlowStep = "upload" | "generating" | "complete";

interface CreateState {
  step: FlowStep;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  source: "file" | "text";
  isExtracting: boolean;
  error?: string;
  successMessage?: string;
  cancelledFileUrls?: Set<string>; // Track cancelled file URLs
  lastAnalysis?: ContentAnalysis; // Store analysis for retrying
}

export default function CreatePage() {
  const router = useRouter();

  const { error: analysisError, clearError: clearAnalysisError } =
    useContentAnalysis();

  const {
    state: generationState,
    generateFlashcards,
    cancelGeneration,
  } = useGenerationProgress();

  const [state, setState] = useState<CreateState>({
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

      // Automatically start generation (which includes analysis)
      await handleGenerateCards(text);
    } catch (error) {
      // Don't show error if upload was cancelled
      if (state.cancelledFileUrls?.has(url)) {
        console.log(
          "🚫 File upload cancelled during error handling - ignoring:",
          url
        );
        return;
      }

      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to extract text",
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

    try {
      // Generate cards (includes analysis step now or reuses existing analysis)
      const result = await generateFlashcards(text, analysisToReuse);

      // Store the analysis for potential retries
      setState((prev) => ({ ...prev, lastAnalysis: result.analysis }));

      // Save to session storage for review page with analysis
      CardsSessionStorage.save(result.cards, result.analysis, text);

      setState((prev) => ({ ...prev, step: "complete" }));

      // Redirect to review after brief success display
      setTimeout(() => {
        router.push("/create/review");
      }, 2000);
    } catch (error) {
      // Handle cancellation gracefully - show success message
      if (error instanceof Error && error.name === "CancellationError") {
        console.log("🔄 Generation was cancelled, returning to upload");
        setState((prev) => ({
          ...prev,
          step: "upload",
          error: undefined,
          successMessage:
            "Generation cancelled successfully. You can start over with new content.",
        }));
        return;
      }

      // For other errors, stay on generation screen to allow retry
      console.error("❌ Generation error:", error);
      setState((prev) => ({
        ...prev,
        // Stay on generating step instead of going back to upload
        error: error instanceof Error ? error.message : "Generation failed",
      }));
    }
  };

  const handleRetryGeneration = () => {
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
    clearAnalysisError();
    CardsSessionStorage.clear();
  };

  const handleClearSuccess = () => {
    setState((prev) => ({ ...prev, successMessage: undefined }));
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

  // Render different states
  const renderContent = () => {
    switch (state.step) {
      case "upload":
        return (
          <div className="space-y-6">
            <FileUploader
              onFileUploaded={handleFileUploaded}
              onTextInput={handleTextInput}
              onUploadCancelled={handleUploadCancelled}
              isExtracting={state.isExtracting}
            />

            {/* Tips Section */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  💡 Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    • Upload well-structured content (textbooks, lecture notes,
                    articles)
                  </li>
                  <li>
                    • Longer texts (500+ words) generate more comprehensive
                    flashcards
                  </li>
                  <li>
                    • AI automatically determines the best question types for
                    your content
                  </li>
                  <li>
                    • You can edit and refine all generated cards in the next
                    step
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case "generating":
        return (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Error Display - Show on generation screen */}
                {state.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-destructive">⚠️</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-destructive mb-2">
                          Generation Failed
                        </h4>
                        <p className="text-sm text-destructive mb-4">
                          {state.error}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetryGeneration}
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            Try Again
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleStartOver}
                            className="text-muted-foreground"
                          >
                            Start Over
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary animate-pulse" />
                    <h3 className="font-semibold text-foreground">
                      Creating Your Flashcards
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {Math.round(generationState.progress)}% complete
                    </div>
                    {generationState.canCancel && !state.error && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelGeneration}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress - Hide when there's an error */}
                {!state.error && (
                  <>
                    {/* Progress Bar and Current Stage */}
                    <div className="space-y-4">
                      <Progress
                        value={generationState.progress}
                        className="h-3"
                      />

                      {/* Single, Clear Current Stage Display */}
                      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <LoadingSpinner size="sm" className="mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-2">
                            {generationState.currentStageDescription}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            AI is analyzing your content and creating targeted
                            flashcards optimized for effective learning
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "complete":
        return (
          <div className="space-y-6">
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-green-800 dark:text-green-200">
                  🎉 Flashcards Generated Successfully!
                </CardTitle>
                <p className="text-green-600 dark:text-green-400">
                  {generationState.generatedCards.length} flashcards created and
                  ready for review
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <LoadingSpinner size="sm" text="Redirecting to review..." />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        {state.step !== "upload" && (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleStartOver}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        )}

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Flashcard Set
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload content and let AI create personalized flashcards instantly
        </p>
      </div>

      {/* Progress Indicator - Updated to 3 steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            step: "upload",
            icon: Upload,
            label: "Upload",
            active: state.step === "upload",
          },
          {
            step: "generating",
            icon: Zap,
            label: "Generate",
            active: state.step === "generating",
          },
          {
            step: "complete",
            icon: FileText,
            label: "Review",
            active: state.step === "complete",
          },
        ].map(({ step, icon: Icon, label, active }) => (
          <Card
            key={step}
            className={`text-center ${active ? "ring-2 ring-primary" : ""}`}
          >
            <CardContent className="p-4">
              <div
                className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p
                className={`text-sm font-medium ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Message Display */}
      {state.successMessage && (
        <div className="mb-6">
          <CancellationSuccess
            message={state.successMessage}
            onClear={handleClearSuccess}
          />
        </div>
      )}

      {/* Error Display - Only show on upload screen, not generating screen */}
      {(state.error || analysisError) && state.step === "upload" && (
        <div className="mb-6">
          <GenerationError
            error={state.error || analysisError || ""}
            onRetry={
              state.error
                ? () => handleGenerateCards(state.extractedText)
                : undefined
            }
            onStartOver={handleStartOver}
          />
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
