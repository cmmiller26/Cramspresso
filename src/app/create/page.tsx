"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { FileUploader } from "@/components/create/FileUploader";
import {
  Upload,
  Brain,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Zap,
  FileText,
  Target,
} from "lucide-react";
import { useContentAnalysis } from "@/hooks/create/useContentAnalysis";
import { useGenerationProgress } from "@/hooks/create/useGenerationProgress";
import { CardsSessionStorage } from "@/lib/CardsSessionStorage";

type FlowStep =
  | "upload"
  | "analyzing"
  | "analysis-complete"
  | "generating"
  | "complete";

interface CreateState {
  step: FlowStep;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  source: "file" | "text";
  isExtracting: boolean;
  error?: string;
}

export default function CreatePage() {
  const router = useRouter();

  const {
    analysis,
    error: analysisError,
    analyzeContent,
    clearError: clearAnalysisError,
  } = useContentAnalysis();

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
  });

  // Handle file upload completion
  const handleFileUploaded = async (url: string, fileName: string) => {
    setState((prev) => ({
      ...prev,
      fileName,
      fileUrl: url,
      source: "file",
      isExtracting: true,
      error: undefined,
    }));

    try {
      const response = await fetch("/api/flashcards/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from file");
      }

      const { text } = await response.json();

      setState((prev) => ({
        ...prev,
        extractedText: text,
        isExtracting: false,
      }));

      // Automatically start analysis
      await handleAnalyzeContent(text);
    } catch (error) {
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

    // Automatically start analysis
    await handleAnalyzeContent(text);
  };

  const handleAnalyzeContent = async (text: string) => {
    setState((prev) => ({ ...prev, step: "analyzing" }));

    try {
      await analyzeContent(text);
      setState((prev) => ({ ...prev, step: "analysis-complete" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "upload",
        error: error instanceof Error ? error.message : "Analysis failed",
      }));
    }
  };

  const handleGenerateCards = async () => {
    if (!analysis || !state.extractedText) return;

    setState((prev) => ({ ...prev, step: "generating" }));

    try {
      const cards = await generateFlashcards(state.extractedText, analysis);

      // Save to session storage for review page
      CardsSessionStorage.save(cards, analysis, state.extractedText);

      setState((prev) => ({ ...prev, step: "complete" }));

      // Redirect to review after brief success display
      setTimeout(() => {
        router.push("/create/review");
      }, 2000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "analysis-complete",
        error: error instanceof Error ? error.message : "Generation failed",
      }));
    }
  };

  const handleStartOver = () => {
    setState({
      step: "upload",
      extractedText: "",
      source: "file",
      isExtracting: false,
    });
    clearAnalysisError();
    CardsSessionStorage.clear();
  };

  const handleClearError = () => {
    setState((prev) => ({ ...prev, error: undefined }));
    clearAnalysisError();
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

      case "analyzing":
        return (
          <Card className="bg-card border-border">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    🤖 AI is analyzing your content...
                  </h3>
                  <p className="text-muted-foreground">
                    Understanding structure, key concepts, and optimal question
                    types
                  </p>
                </div>

                <LoadingSpinner size="lg" className="py-4" />

                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground text-center">
                    ⚡ This usually takes 10-30 seconds depending on content
                    length
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "analysis-complete":
        if (!analysis) return null;

        return (
          <div className="space-y-6">
            {/* Analysis Results */}
            <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800 dark:text-green-200">
                      ✅ Content Analysis Complete
                    </CardTitle>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Analysis Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {analysis.estimatedCards}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Flashcards
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200 capitalize">
                        {analysis.contentType}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Content Type
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {Math.round(analysis.confidence * 100)}%
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Confidence
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      AI Strategy
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {analysis.reasoning}
                    </p>
                  </div>

                  {/* Key Topics */}
                  {analysis.keyTopics.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        Key Topics Identified:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-md text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="text-center">
              <LoadingButton
                onClick={handleGenerateCards}
                loading={generationState.isGenerating}
                loadingText="Generating..."
                size="lg"
                className="min-w-[200px]"
              >
                <Zap className="w-5 h-5 mr-2" />
                Generate {analysis.estimatedCards} Flashcards
              </LoadingButton>
            </div>
          </div>
        );

      case "generating":
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
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {Math.round(generationState.progress)}% complete
                    </div>
                    {generationState.canCancel && (
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

                {/* Progress */}
                <div className="space-y-2">
                  <Progress value={generationState.progress} className="h-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {generationState.currentStageDescription}
                  </p>
                </div>

                {/* Current Stage */}
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <LoadingSpinner size="sm" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {generationState.currentStageDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creating high-quality, targeted flashcards optimized for
                      your learning
                    </p>
                  </div>
                </div>

                {/* AI Tips */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    🤖 What&apos;s Happening
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI is crafting questions that test comprehension,
                    recall, and application based on your content&apos;s unique
                    structure and key concepts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "complete":
        return (
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

      {/* Progress Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            step: "upload",
            icon: Upload,
            label: "Upload",
            active: state.step === "upload",
          },
          {
            step: "analyzing",
            icon: Brain,
            label: "AI Analysis",
            active: ["analyzing", "analysis-complete"].includes(state.step),
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

      {/* Error Display */}
      {(state.error || analysisError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{state.error || analysisError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearError}
              className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}
