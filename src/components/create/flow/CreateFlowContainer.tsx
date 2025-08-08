import React from "react";
import { FileText, Upload, Zap } from "lucide-react";
import { FlowProgressIndicator } from "@/components/create/flow/FlowProgressIndicator";
import { GenerationStep } from "@/components/create/generation/GenerationStep";
import { CompletionStep } from "@/components/create/generation/CompletionStep";
import { UploadStep } from "@/components/create/upload/UploadStep";
import type {
  FlowStep,
  CreateFlowState,
  GenerationState,
} from "@/lib/types/create";

interface CreateFlowContainerProps {
  state: CreateFlowState;
  generationState: GenerationState;
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onTextInput: (text: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  onStartOver: () => void;
  onRetryGeneration: () => void;
  onCancelGeneration: () => void;
  className?: string;
}

const FLOW_STEPS = [
  {
    step: "upload" as FlowStep,
    label: "Upload",
    icon: Upload,
    description: "Upload your content or paste text directly",
  },
  {
    step: "generating" as FlowStep,
    label: "Generate",
    icon: Zap,
    description: "AI analyzes content and creates flashcards",
  },
  {
    step: "complete" as FlowStep,
    label: "Review",
    icon: FileText,
    description: "Review and edit your generated flashcards",
  },
];

export function CreateFlowContainer({
  state,
  generationState,
  onFileUploaded,
  onTextInput,
  onUploadCancelled,
  onStartOver,
  onRetryGeneration,
  onCancelGeneration,
  className = "",
}: CreateFlowContainerProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Flow Progress Indicator */}
      <FlowProgressIndicator
        currentStep={state.step}
        steps={FLOW_STEPS}
        showLabels={true}
      />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {state.step === "upload" && (
          <UploadStep
            onFileUploaded={onFileUploaded}
            onTextInput={onTextInput}
            onUploadCancelled={onUploadCancelled}
            isExtracting={state.isExtracting}
            error={state.error}
            onClearError={onStartOver}
          />
        )}

        {state.step === "generating" && (
          <GenerationStep
            progress={generationState.progress}
            stage={generationState.currentStageDescription}
            currentStageDescription={generationState.currentStageDescription}
            error={state.error}
            canCancel={generationState.canCancel}
            onCancel={onCancelGeneration}
            onRetry={onRetryGeneration}
            onStartOver={onStartOver}
          />
        )}

        {state.step === "complete" && (
          <CompletionStep
            cardCount={generationState.generatedCards.length}
            onRedirect={() => {
              // Handled by parent component redirect logic
            }}
            onCreateAnother={onStartOver}
          />
        )}
      </div>
    </div>
  );
}
