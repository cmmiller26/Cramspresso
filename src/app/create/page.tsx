"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/create/FileUploader";
import { FilePreview } from "@/components/create/FilePreview";
import {
  GenerationSettings,
  GenerationConfig,
} from "@/components/create/GenerationSettings";
import { UploadProgress, UploadStep } from "@/components/create/UploadProgress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Brain, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FlowStep = "upload" | "preview" | "settings" | "generating" | "complete";

interface UploadState {
  step: FlowStep;
  uploadStep?: UploadStep;
  uploadProgress: number;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  source: "file" | "text";
  isExtracting: boolean;
  isGenerating: boolean;
  error?: string;
  generatedCards?: { question: string; answer: string }[];
}

export default function CreatePage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({
    step: "upload",
    uploadProgress: 0,
    extractedText: "",
    source: "file",
    isExtracting: false,
    isGenerating: false,
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

  // Handle flashcard generation
  const handleGenerate = async (config: GenerationConfig) => {
    console.log("Generation config:", config); // Log config for future API enhancement

    setState((prev) => ({
      ...prev,
      step: "generating",
      isGenerating: true,
      uploadStep: "generating",
      uploadProgress: 0,
      error: undefined,
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
        }));
      }, 500);

      // Note: In the future, we can pass config to the API to customize generation
      // For now, we use the existing API that generates based on text only
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: state.extractedText }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const { cards } = await response.json();

      setState((prev) => ({
        ...prev,
        step: "complete",
        uploadStep: "complete",
        uploadProgress: 100,
        generatedCards: cards,
        isGenerating: false,
      }));

      // Redirect to review page with cards data
      // For now, we'll simulate the redirect
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
        uploadStep: "error",
        isGenerating: false,
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
                state.step === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10"
              }`}
            >
              <Upload className="w-6 h-6 text-primary" />
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10"
              }`}
            >
              <Brain className="w-6 h-6 text-primary" />
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10"
              }`}
            >
              <FileText className="w-6 h-6 text-primary" />
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
            isGenerating={state.isGenerating}
            estimatedCardCount={estimatedCardCount}
          />
        </div>
      )}

      {state.step === "generating" && state.uploadStep && (
        <div className="space-y-6">
          <UploadProgress
            currentStep={state.uploadStep}
            progress={state.uploadProgress}
            message={
              state.uploadStep === "generating"
                ? `Creating ${estimatedCardCount} flashcards from your content...`
                : undefined
            }
            error={state.error}
          />
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
