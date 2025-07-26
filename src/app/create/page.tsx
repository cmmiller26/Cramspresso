"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/create/FileUploader";
import { FilePreview } from "@/components/create/FilePreview";
import {
  GenerationSettings,
  GenerationConfig,
} from "@/components/create/GenerationSettings";
import { useGenerationProgress } from "@/hooks/create/useGenerationProgress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Brain, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FlowStep = "upload" | "preview" | "settings" | "generating" | "complete";

interface UploadState {
  step: FlowStep;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  source: "file" | "text";
  isExtracting: boolean;
  error?: string;
  generatedCards?: { question: string; answer: string }[];
}

export default function CreatePage() {
  const router = useRouter();
  const {
    state: generationState,
    startGeneration,
    cancelGeneration,
  } = useGenerationProgress();

  const [state, setState] = useState<UploadState>({
    step: "upload",
    extractedText: "",
    source: "file",
    isExtracting: false,
  });

  // Handle file upload completion
  const handleFileUploaded = async (url: string, fileName: string) => {
    setState((prev) => ({
      ...prev,
      step: "preview",
      fileName,
      fileUrl: url,
      source: "file",
      isExtracting: true,
      error: undefined,
    }));

    try {
      // Extract text from uploaded file
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
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to extract text",
        isExtracting: false,
      }));
    }
  };

  // Handle direct text input
  const handleTextInput = (text: string) => {
    setState((prev) => ({
      ...prev,
      step: "preview",
      extractedText: text,
      source: "text",
      fileName: undefined,
      fileUrl: undefined,
    }));
  };

  // Handle flashcard generation with enhanced progress
  const handleGenerate = async (config: GenerationConfig) => {
    console.log("Generation config:", config);

    setState((prev) => ({
      ...prev,
      step: "generating",
      error: undefined,
    }));

    try {
      const cards = await startGeneration(state.extractedText, config);

      setState((prev) => ({
        ...prev,
        step: "complete",
        generatedCards: cards,
      }));

      // Redirect to review page
      setTimeout(() => {
        router.push("/create/review");
      }, 2000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate flashcards",
        step: "settings", // Go back to settings on error
      }));
    }
  };

  // Handle retry for text extraction
  const handleRetry = () => {
    if (state.fileUrl && state.fileName) {
      handleFileUploaded(state.fileUrl, state.fileName);
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      step: prev.step === "settings" ? "preview" : "upload",
      error: undefined,
    }));
  };

  // Handle proceeding to settings
  const handleProceedToSettings = () => {
    setState((prev) => ({
      ...prev,
      step: "settings",
    }));
  };

  const estimatedCardCount = Math.max(
    1,
    Math.floor(state.extractedText.split(/\s+/).length / 50)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Create New Flashcard Set
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload a document and let AI generate personalized flashcards for your
          study materials
        </p>
      </div>

      {/* Error Display */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card
          className={`bg-card border-border ${
            state.step === "upload" ? "ring-2 ring-primary" : ""
          }`}
        >
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                state.step === "upload" ? "bg-primary" : "bg-primary/10"
              }`}
            >
              <Upload
                className={`w-6 h-6 ${
                  state.step === "upload"
                    ? "text-primary-foreground"
                    : "text-primary"
                }`}
              />
            </div>
            <CardTitle className="text-foreground">1. Upload</CardTitle>
            <CardDescription>
              Upload your PDF, text file, or paste content directly
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`bg-card border-border ${
            state.step === "preview" || state.step === "settings"
              ? "ring-2 ring-primary"
              : ""
          }`}
        >
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                state.step === "preview" || state.step === "settings"
                  ? "bg-primary"
                  : "bg-primary/10"
              }`}
            >
              <Brain
                className={`w-6 h-6 ${
                  state.step === "preview" || state.step === "settings"
                    ? "text-primary-foreground"
                    : "text-primary"
                }`}
              />
            </div>
            <CardTitle className="text-foreground">2. Generate</CardTitle>
            <CardDescription>
              AI analyzes your content and creates targeted Q&A pairs
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`bg-card border-border ${
            state.step === "generating" || state.step === "complete"
              ? "ring-2 ring-primary"
              : ""
          }`}
        >
          <CardHeader className="text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                state.step === "generating" || state.step === "complete"
                  ? "bg-primary"
                  : "bg-primary/10"
              }`}
            >
              <FileText
                className={`w-6 h-6 ${
                  state.step === "generating" || state.step === "complete"
                    ? "text-primary-foreground"
                    : "text-primary"
                }`}
              />
            </div>
            <CardTitle className="text-foreground">3. Review</CardTitle>
            <CardDescription>
              Review, edit, and customize your flashcards before saving
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Based on Current Step */}
      {state.step === "upload" && (
        <FileUploader
          onFileUploaded={handleFileUploaded}
          onTextInput={handleTextInput}
          isExtracting={state.isExtracting}
        />
      )}

      {state.step === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <FilePreview
            fileName={state.fileName}
            extractedText={state.extractedText}
            isExtracting={state.isExtracting}
            onRetry={handleRetry}
            source={state.source}
          />

          {!state.isExtracting && state.extractedText && (
            <div className="flex justify-end">
              <Button onClick={handleProceedToSettings} size="lg">
                Configure Generation
                <Brain className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {state.step === "settings" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Preview
            </Button>
          </div>

          <GenerationSettings
            onGenerate={handleGenerate}
            isGenerating={generationState.isGenerating}
            estimatedCardCount={estimatedCardCount}
          />
        </div>
      )}

      {state.step === "generating" && (
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Enhanced header */}
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
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <Progress value={generationState.progress} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>AI Processing</span>
                    <span>
                      {generationState.wordsProcessed.toLocaleString()} /{" "}
                      {generationState.totalWords.toLocaleString()} words
                    </span>
                  </div>
                </div>

                {/* Current stage message */}
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <Brain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {generationState.currentStageDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This process ensures high-quality, targeted flashcards for
                      optimal learning
                    </p>
                  </div>
                </div>

                {/* Stage indicators */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Analyze", threshold: 20 },
                    { label: "Extract", threshold: 45 },
                    { label: "Generate", threshold: 75 },
                    { label: "Format", threshold: 95 },
                  ].map((stage, index) => (
                    <div key={index} className="text-center">
                      <div
                        className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                          generationState.progress >= stage.threshold
                            ? "bg-green-100 text-green-700 border-2 border-green-300"
                            : generationState.progress >=
                              (index > 0 ? [0, 20, 45, 75][index - 1] : 0)
                            ? "bg-primary/10 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground border-2 border-muted"
                        }`}
                      >
                        {generationState.progress >= stage.threshold
                          ? "✓"
                          : index + 1}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stage.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Tips */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    🤖 AI Generation Process
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing your content structure and creating
                    questions that test comprehension, recall, and application.
                    Each card is crafted to maximize your learning
                    effectiveness.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {state.step === "complete" && (
        <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="text-center">
            <CardTitle className="text-green-800 dark:text-green-200">
              Flashcards Generated Successfully!
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              {state.generatedCards?.length || estimatedCardCount} flashcards
              have been created. Redirecting to review page...
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Tips Section (shown in upload step) */}
      {state.step === "upload" && (
        <Card className="mt-8 bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              💡 Tips for Better Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                • Upload well-structured content with clear concepts and
                definitions
              </li>
              <li>
                • Longer texts (500+ words) generate more comprehensive
                flashcards
              </li>
              <li>
                • Academic papers, textbook chapters, and lecture notes work
                best
              </li>
              <li>
                • You can edit and customize all generated flashcards in the
                next step
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
