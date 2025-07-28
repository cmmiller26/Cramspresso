"use client";

import { useState } from "react";
import { UploadZone } from "@/components/shared/UploadZone";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { FileUploadError } from "@/components/shared/ErrorStates";
import { ClientUploadedFileData } from "uploadthing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, ArrowLeft } from "lucide-react";

interface FileUploaderProps {
  onFileUploaded: (url: string, fileName: string) => void;
  onTextInput: (text: string) => void;
  isExtracting?: boolean;
}

type UploaderState = "choosing" | "text-input" | "uploading" | "processing";

export function FileUploader({
  onFileUploaded,
  onTextInput,
  isExtracting = false,
}: FileUploaderProps) {
  const [state, setState] = useState<UploaderState>("choosing");
  const [textInput, setTextInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadComplete = (files: ClientUploadedFileData<null>[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      setUploadError(null);
      setState("processing");
      onFileUploaded(file.ufsUrl, file.name);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setUploadError(error.message || "Failed to upload file");
    setState("choosing");
  };

  const handleTextSubmit = () => {
    if (textInput.trim().length === 0) {
      setUploadError("Please enter some text to generate flashcards");
      return;
    }

    if (textInput.trim().length < 50) {
      setUploadError(
        "Please enter at least 50 characters for better flashcard generation"
      );
      return;
    }

    setUploadError(null);
    setState("processing");
    onTextInput(textInput.trim());
  };

  const handleBackToChoosing = () => {
    setTextInput("");
    setState("choosing");
    setUploadError(null);
  };

  const handleShowTextInput = () => {
    setState("text-input");
    setUploadError(null);
  };

  const handleClearError = () => {
    setUploadError(null);
  };

  // Show processing state after upload/text input
  if (state === "processing" || isExtracting) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <LoadingSpinner
            size="lg"
            text="Extracting and analyzing content..."
            className="py-8"
          />
          <div className="bg-muted/30 rounded-lg p-4 mt-6">
            <p className="text-sm text-muted-foreground">
              💡 We&apos;re extracting key concepts and preparing your content
              for AI analysis. This ensures the best possible flashcard
              generation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show text input interface
  if (state === "text-input") {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Paste Your Text
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToChoosing}
                disabled={isExtracting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your study material here... (minimum 50 characters for best results)"
                className="w-full h-40 p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isExtracting}
              />

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-4">
                  <span
                    className={`${
                      textInput.length >= 50
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {textInput.length} characters
                  </span>
                  {textInput.length >= 50 && (
                    <span className="text-green-600 font-medium">
                      ✓ Good length
                    </span>
                  )}
                  {textInput.length > 0 && textInput.length < 50 && (
                    <span className="text-yellow-600">
                      Need {50 - textInput.length} more characters
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  Est.{" "}
                  {Math.max(1, Math.floor(textInput.split(/\s+/).length / 50))}{" "}
                  cards
                </span>
              </div>

              {uploadError && (
                <FileUploadError
                  error={uploadError}
                  onClear={handleClearError}
                />
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleBackToChoosing}
                  disabled={isExtracting}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleTextSubmit}
                  loading={isExtracting}
                  disabled={textInput.trim().length === 0}
                  loadingText="Processing..."
                  className="min-w-[120px]"
                >
                  Continue
                </LoadingButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default choosing interface
  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Upload File</h3>
          </div>

          {uploadError && (
            <div className="mb-4">
              <FileUploadError
                error={uploadError}
                onRetry={() => setState("choosing")}
                onClear={handleClearError}
              />
            </div>
          )}

          <div className="space-y-4">
            <UploadZone
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={isExtracting}
            />

            {/* Upload Tips */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">
                📄 Supported File Types
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PDF documents (up to 10MB)</li>
                <li>• Text files (.txt)</li>
                <li>• Word documents (.docx)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">
            Or paste your text
          </span>
        </div>
      </div>

      {/* Text Input Option */}
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center">
          <FileText className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Paste Text Directly
          </h3>
          <p className="text-muted-foreground mb-4">
            Already have your text ready? Paste it directly here
          </p>
          <LoadingButton
            onClick={handleShowTextInput}
            loading={isExtracting}
            disabled={isExtracting}
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            Paste Text
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  );
}
