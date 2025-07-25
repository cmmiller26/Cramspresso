"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { ClientUploadedFileData } from "uploadthing/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Clock, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UploadProgressData {
  progress: number;
  uploadSpeed: string;
  uploadedSize: string;
  totalSize: string;
  estimatedTime: string;
  fileName: string;
}

interface Props {
  onClientUploadComplete: (files: ClientUploadedFileData<null>[]) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}

// Utility functions moved outside component to avoid dependency issues
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  return `${formatFileSize(bytesPerSecond)}/s`;
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export function UploadZone({
  onClientUploadComplete,
  onUploadError,
  disabled = false,
}: Props) {
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    progress: UploadProgressData | null;
    error: string | null;
    isCompleted: boolean;
  }>({
    isUploading: false,
    progress: null,
    error: null,
    isCompleted: false,
  });

  const handleUploadProgress = useCallback((progress: number, file?: File) => {
    if (!file) return;

    const uploadedBytes = (file.size * progress) / 100;

    // Estimate upload speed (simplified calculation)
    const estimatedSpeed = uploadedBytes / 2; // Rough estimate
    const remainingBytes = file.size - uploadedBytes;
    const estimatedTime = remainingBytes / Math.max(estimatedSpeed, 1);

    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      progress: {
        progress,
        uploadSpeed: formatSpeed(estimatedSpeed),
        uploadedSize: formatFileSize(uploadedBytes),
        totalSize: formatFileSize(file.size),
        estimatedTime: formatTime(estimatedTime),
        fileName: file.name,
      },
    }));
  }, []);

  const handleUploadComplete = (files: ClientUploadedFileData<null>[]) => {
    setUploadState((prev) => ({
      ...prev,
      isUploading: false,
      isCompleted: true,
      progress: prev.progress ? { ...prev.progress, progress: 100 } : null,
    }));

    // Small delay to show completion state
    setTimeout(() => {
      onClientUploadComplete(files);
    }, 1000);
  };

  const handleUploadError = (error: Error) => {
    setUploadState((prev) => ({
      ...prev,
      isUploading: false,
      error: error.message,
    }));

    if (onUploadError) {
      onUploadError(error);
    }
  };

  const handleCancelUpload = () => {
    // Note: UploadThing doesn't expose cancel directly, but we can reset state
    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
      isCompleted: false,
    });
  };

  const handleRetry = () => {
    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
      isCompleted: false,
    });
  };

  // Show upload progress UI
  if (uploadState.isUploading && uploadState.progress) {
    return (
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium text-foreground">
                  Uploading File
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelUpload}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* File Name */}
            <div className="text-sm text-muted-foreground truncate">
              {uploadState.progress.fileName}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={uploadState.progress.progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {Math.round(uploadState.progress.progress)}% complete
                </span>
                <span>{uploadState.progress.uploadSpeed}</span>
              </div>
            </div>

            {/* Upload Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium text-foreground">
                  {uploadState.progress.uploadedSize} /{" "}
                  {uploadState.progress.totalSize}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {uploadState.progress.estimatedTime} remaining
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show completion state
  if (uploadState.isCompleted) {
    return (
      <Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
            Upload Complete!
          </h3>
          <p className="text-sm text-green-600 dark:text-green-400">
            {uploadState.progress?.fileName} uploaded successfully
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (uploadState.error) {
    return (
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-medium text-destructive mb-2">Upload Failed</h3>
          <p className="text-sm text-destructive/80 mb-4">
            {uploadState.error}
          </p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default upload dropzone
  return (
    <UploadDropzone
      endpoint="pdfAndTxt"
      onClientUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      onUploadProgress={handleUploadProgress}
      disabled={disabled}
      config={{
        mode: "auto",
      }}
      appearance={{
        container: `
          border-2 border-dashed border-border rounded-lg bg-muted/30 
          hover:bg-muted/50 transition-colors p-8 
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `,
        uploadIcon: "text-muted-foreground mb-4",
        label: "text-foreground font-medium text-lg mb-4",
        allowedContent: "text-muted-foreground text-sm mb-4",
        button: `
          !bg-primary !text-primary-foreground 
          hover:!bg-primary/90 !transition-colors 
          !px-6 !py-2 !rounded-md !font-medium
          !border-0 !outline-none !mb-4
          focus:!ring-2 focus:!ring-primary focus:!ring-offset-2
          ${disabled ? "!opacity-50 !cursor-not-allowed" : ""}
        `,
      }}
      content={{
        label: "Drag and drop your file here",
        allowedContent: "PDF, TXT, DOCX files up to 10MB",
        button: disabled ? "Uploading..." : "Choose File",
      }}
    />
  );
}
