"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Upload,
  Brain,
  FileText,
  AlertCircle,
} from "lucide-react";

export type UploadStep =
  | "uploading"
  | "extracting"
  | "generating"
  | "complete"
  | "error";

interface UploadProgressProps {
  currentStep: UploadStep;
  progress: number;
  message?: string;
  error?: string;
}

interface Step {
  id: UploadStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEPS: Step[] = [
  {
    id: "uploading",
    label: "Uploading File",
    icon: Upload,
    description: "Uploading your document to the server",
  },
  {
    id: "extracting",
    label: "Extracting Text",
    icon: FileText,
    description: "Extracting text content from your document",
  },
  {
    id: "generating",
    label: "Generating Cards",
    icon: Brain,
    description: "AI is creating your personalized flashcards",
  },
  {
    id: "complete",
    label: "Complete",
    icon: CheckCircle,
    description: "Your flashcards are ready for review",
  },
];

const TIME_ESTIMATES: Record<UploadStep, string> = {
  uploading: "30 seconds",
  extracting: "15 seconds",
  generating: "45 seconds",
  complete: "",
  error: "",
};

export function UploadProgress({
  currentStep,
  progress,
  message,
  error,
}: UploadProgressProps) {
  if (currentStep === "error") {
    return (
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-medium">Upload Failed</h3>
              <p className="text-sm text-destructive/80">
                {error || "An unexpected error occurred"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const currentStepData =
    currentStepIndex >= 0 ? STEPS[currentStepIndex] : null;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-foreground">
                {currentStepData?.label || "Processing"}
              </h3>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step Details */}
          {currentStepData && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <currentStepData.icon className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {currentStepData.description}
                </p>
                {message && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step List */}
          <div className="space-y-3">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                    ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <StepIcon
                        className={`w-4 h-4 ${
                          isCurrent ? "animate-pulse" : ""
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted || isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Estimated Time */}
          {currentStep === "uploading" ||
          currentStep === "extracting" ||
          currentStep === "generating" ? (
            <div className="text-center text-sm text-muted-foreground">
              <p>Estimated time remaining: {TIME_ESTIMATES[currentStep]}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
