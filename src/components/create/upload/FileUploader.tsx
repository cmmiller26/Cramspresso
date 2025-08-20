"use client";

import { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { LoadingButton } from "@/components/shared/LoadingButton";
import {
  FileUploadError,
  FileUploadWarning,
} from "@/components/shared/ErrorStates";
import { ClientUploadedFileData } from "uploadthing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle,
  Brain,
  X,
} from "lucide-react";

interface FileUploaderProps {
  onFileUploaded: (url: string, fileName: string) => void;
  onTextInput: (text: string) => void;
  onUploadCancelled?: (url?: string) => void; // Callback to notify parent of cancellation
  isExtracting?: boolean;
}

type UploaderState =
  | "choosing"
  | "text-input"
  | "uploading"
  | "upload-complete";

export function FileUploader({
  onFileUploaded,
  onTextInput,
  onUploadCancelled,
  isExtracting = false,
}: FileUploaderProps) {
  const [state, setState] = useState<UploaderState>("choosing");
  const [textInput, setTextInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [isUploadCancelled, setIsUploadCancelled] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  // Track upload ID to identify cancelled uploads with timestamp for more robust checking
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [cancelledUploadIds, setCancelledUploadIds] = useState<Set<string>>(
    new Set()
  );

  // Track timeout for upload completion to clear it on cancel
  const [uploadCompletionTimeout, setUploadCompletionTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Track the file URL for cancellation notification
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);

  const handleUploadBegin = () => {
    const uploadId = Date.now().toString(); // Simple unique ID
    setCurrentUploadId(uploadId);
    setState("uploading");
    setUploadProgress(0);
    setUploadError(null);
    setIsUploadCancelled(false);
    console.log("🚀 Starting upload with ID:", uploadId);
  };

  const handleUploadProgress = (progress: number) => {
    if (!isUploadCancelled) {
      setUploadProgress(progress);
    }
  };

  const handleUploadComplete = (files: ClientUploadedFileData<unknown>[]) => {
    console.log("📁 Upload completed, checking if cancelled...", {
      uploadId: currentUploadId,
      cancelled: isUploadCancelled,
      cancelledIds: Array.from(cancelledUploadIds),
      filesCount: files?.length,
    });

    // Check if this specific upload was cancelled using both current state and ID tracking
    if (
      isUploadCancelled ||
      (currentUploadId && cancelledUploadIds.has(currentUploadId))
    ) {
      console.log(
        "🚫 Upload was cancelled - ignoring completion and clearing upload ID"
      );
      setCurrentUploadId(null); // Clear it now since we're ignoring this upload
      return;
    }

    if (files && files.length > 0) {
      const file = files[0];
      console.log("✅ Processing successful upload:", file.name);

      setUploadedFile({ url: file.ufsUrl, name: file.name });
      setCurrentFileUrl(file.ufsUrl); // Track the file URL
      setState("upload-complete");
      setUploadError(null);

      // Show success state briefly, then proceed to generation
      const timeoutId = setTimeout(() => {
        // Final check before proceeding
        if (
          !isUploadCancelled &&
          !(currentUploadId && cancelledUploadIds.has(currentUploadId))
        ) {
          console.log("➡️ Proceeding to generation step");
          onFileUploaded(file.ufsUrl, file.name);
        } else {
          console.log(
            "🚫 Upload was cancelled after completion - not proceeding"
          );
        }
        setUploadCompletionTimeout(null);
      }, 1500);

      setUploadCompletionTimeout(timeoutId);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("❌ Upload error:", error);

    // Don't show error if user cancelled
    if (isUploadCancelled) {
      console.log("🚫 Upload error occurred but user cancelled - ignoring");
      return;
    }

    setUploadError(error.message || "Failed to upload file");
    setState("choosing");
    setUploadProgress(0);
    setIsUploadCancelled(false);
    setCurrentUploadId(null);
  };

  const handleCancelUpload = () => {
    console.log("🚫 User cancelled upload - Upload ID:", currentUploadId);

    // Clear any pending timeout to prevent generation from starting
    if (uploadCompletionTimeout) {
      console.log("🚫 Clearing upload completion timeout");
      clearTimeout(uploadCompletionTimeout);
      setUploadCompletionTimeout(null);
    }

    // Mark as cancelled immediately and track the cancelled ID
    setIsUploadCancelled(true);
    if (currentUploadId) {
      setCancelledUploadIds((prev) => {
        const newSet = new Set(prev).add(currentUploadId);
        console.log(
          "🚫 Added to cancelled IDs:",
          currentUploadId,
          "Total cancelled:",
          Array.from(newSet)
        );
        return newSet;
      });
    }

    // Notify parent about cancellation with current file URL if available
    if (onUploadCancelled) {
      console.log(
        "🚫 Notifying parent of upload cancellation, file URL:",
        currentFileUrl
      );
      onUploadCancelled(currentFileUrl || undefined);
    }

    // Reset state to choosing
    setState("choosing");
    setUploadProgress(0);
    setUploadedFile(null);
    setCurrentFileUrl(null);
    // DON'T clear currentUploadId yet - we need it to check against cancelledUploadIds

    // Set warning instead of error for cancellation
    setUploadWarning(
      "Upload cancelled. File may still upload in background due to service limitations."
    );
    setUploadError(null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim().length < 50) {
      setUploadError("Please enter at least 50 characters for better results");
      return;
    }

    setUploadError(null);
    // Directly call onTextInput - no intermediate processing state
    onTextInput(textInput.trim());
  };

  const handleBackToChoosing = () => {
    // Clear any pending timeout
    if (uploadCompletionTimeout) {
      clearTimeout(uploadCompletionTimeout);
      setUploadCompletionTimeout(null);
    }

    setTextInput("");
    setState("choosing");
    setUploadError(null);
    setUploadWarning(null);
    setUploadProgress(0);
    setUploadedFile(null);
    setCurrentFileUrl(null);
    setIsUploadCancelled(false);
    setCurrentUploadId(null);
    // Clear cancelled IDs when starting fresh
    setCancelledUploadIds(new Set());
  };

  const handleShowTextInput = () => {
    setState("text-input");
    setUploadError(null);
    setUploadWarning(null);
  };

  const handleClearError = () => {
    setUploadError(null);
  };

  const handleClearWarning = () => {
    setUploadWarning(null);
  };

  const wordCount = textInput
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const estimatedCards = Math.max(1, Math.floor(wordCount / 25));

  // Show file uploading progress
  if (state === "uploading") {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Uploading Your File
              </h3>
              <p className="text-muted-foreground">
                Please wait while your file is being uploaded...
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Upload Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleCancelUpload}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Upload
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Upload may continue in background due to service
                limitations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upload success state (keep this - it's useful feedback)
  if (state === "upload-complete" && uploadedFile) {
    return (
      <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Upload Complete!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                {uploadedFile.name} uploaded successfully
              </p>
              <p className="text-green-500 dark:text-green-500 text-sm mt-1">
                Starting flashcard generation...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show text input interface
  if (state === "text-input") {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Paste Your Content
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleBackToChoosing}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your study material here... (textbook chapters, lecture notes, articles, etc.)"
            className="w-full h-48 resize-none"
            disabled={isExtracting}
          />

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span
                className={
                  wordCount >= 20 ? "text-green-600" : "text-muted-foreground"
                }
              >
                {wordCount} words
              </span>
              {wordCount >= 20 && (
                <span className="text-green-600 font-medium">
                  ✓ Good length
                </span>
              )}
              {wordCount > 0 && wordCount < 20 && (
                <span className="text-yellow-600">Need more content</span>
              )}
            </div>
            <span className="text-muted-foreground">
              Est. {estimatedCards} cards
            </span>
          </div>

          {uploadError && (
            <FileUploadError error={uploadError} onClear={handleClearError} />
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleBackToChoosing}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleTextSubmit}
              loading={isExtracting}
              disabled={wordCount < 20}
              loadingText="Creating..."
              className="min-w-[140px]"
            >
              <Brain className="w-4 h-4 mr-2" />
              Create Flashcards
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default choosing interface
  return (
    <div className="space-y-4">
      {/* Global error display - shows above all content */}
      {uploadError && (
        <FileUploadError error={uploadError} onClear={handleClearError} />
      )}

      {/* Global warning display - shows above all content */}
      {uploadWarning && (
        <FileUploadWarning
          message={uploadWarning}
          onClear={handleClearWarning}
        />
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Option */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadZone
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              onUploadBegin={handleUploadBegin}
              onUploadProgress={handleUploadProgress}
              disabled={isExtracting}
            />

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">
                📄 Supported Files
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PDF documents (up to 8MB)</li>
                <li>• Text files (.txt)</li>
                <li>• Word documents (.docx)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Text Input Option */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Paste Text Directly
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <FileText className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                Have Text Ready?
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Copy and paste your study material directly for instant creation
              </p>
              <LoadingButton
                onClick={handleShowTextInput}
                loading={isExtracting}
                disabled={isExtracting}
                variant="outline"
                className="w-full"
                loadingText="Processing..."
              >
                <FileText className="w-4 h-4 mr-2" />
                Paste Content
              </LoadingButton>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">
                💡 Best Results
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use 100+ words for optimal cards</li>
                <li>• Include definitions and examples</li>
                <li>• Structured content works best</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
