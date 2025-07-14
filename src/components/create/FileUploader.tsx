"use client";

import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { ClientUploadedFileData } from "uploadthing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploaderProps {
  onFileUploaded: (url: string, fileName: string) => void;
  onTextInput: (text: string) => void;
  isExtracting?: boolean;
}

export function FileUploader({
  onFileUploaded,
  onTextInput,
  isExtracting = false,
}: FileUploaderProps) {
  const [textInput, setTextInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const handleUploadComplete = (files: ClientUploadedFileData<null>[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      setUploadError(null);
      onFileUploaded(file.url, file.name);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    setUploadError(error.message || "Failed to upload file");
  };

  const handleTextSubmit = () => {
    if (textInput.trim().length < 50) {
      setUploadError("Please enter at least 50 characters for better results");
      return;
    }
    setUploadError(null);
    onTextInput(textInput.trim());
  };

  const clearTextInput = () => {
    setTextInput("");
    setShowTextInput(false);
    setUploadError(null);
  };

  if (showTextInput) {
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
                onClick={clearTextInput}
                disabled={isExtracting}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your study material here... (minimum 50 characters)"
              className="w-full h-40 p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isExtracting}
            />

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {textInput.length} characters
                {textInput.length < 50 && (
                  <span className="text-destructive ml-1">
                    (minimum 50 required)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearTextInput}
                  disabled={isExtracting}
                >
                  Back to Upload
                </Button>
                <Button
                  onClick={handleTextSubmit}
                  disabled={isExtracting || textInput.trim().length < 50}
                >
                  {isExtracting ? "Processing..." : "Continue"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <UploadDropzone
              endpoint="pdfAndTxt"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              disabled={isExtracting}
              config={{
                mode: "auto",
              }}
              appearance={{
                container:
                  "border-2 border-dashed border-border rounded-lg bg-muted/30 p-8",
                uploadIcon: "text-muted-foreground",
                label: "text-foreground font-medium",
                allowedContent: "text-muted-foreground text-sm",
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90",
              }}
            />

            <p className="text-sm text-muted-foreground text-center">
              Supports PDF, TXT, DOCX files up to 10MB
            </p>
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
          <Button
            variant="outline"
            onClick={() => setShowTextInput(true)}
            disabled={isExtracting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Paste Text
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
