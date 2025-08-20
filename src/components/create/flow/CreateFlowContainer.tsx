import React from "react";
import { Upload, Zap, Eye } from "lucide-react";
import { FlowProgressIndicator } from "@/components/create/flow/FlowProgressIndicator";
import { GenerationStep } from "@/components/create/generation/GenerationStep";
import { UploadStep } from "@/components/create/upload/UploadStep";
import { PreviewStep } from "@/components/create/preview/PreviewStep";
import type {
  FlowStep,
  CreateFlowState,
  GenerationState,
  PreviewState,
} from "@/lib/types/create";

interface CreateFlowContainerProps {
  state: CreateFlowState;
  generationState: GenerationState;
  previewState: PreviewState;
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onTextInput: (text: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  onStartOver: () => void;
  onRetryGeneration: () => void;
  onCancelGeneration: () => void;
  onSaveSet: (setName: string) => Promise<void>;
  onToggleAnalysis: () => void;
  onNavigateToEdit: () => void;
  onNavigateToStudy: () => void;
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
    step: "preview" as FlowStep,
    label: "Preview",
    icon: Eye,
    description: "Review your flashcards and save your set",
  },
];

export function CreateFlowContainer({
  state,
  generationState,
  previewState,
  onFileUploaded,
  onTextInput,
  onUploadCancelled,
  onStartOver,
  onRetryGeneration,
  onCancelGeneration,
  onSaveSet,
  onToggleAnalysis,
  onNavigateToEdit,
  onNavigateToStudy,
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

        {state.step === "preview" && (
          <PreviewStep
            cards={previewState.cards}
            analysis={previewState.analysis}
            onSave={onSaveSet}
            isSaving={previewState.isSaving}
            saveProgress={previewState.saveProgress}
            error={previewState.error || undefined}
            isAnalysisExpanded={previewState.isAnalysisExpanded}
            onToggleAnalysis={onToggleAnalysis}
            showSuccessState={previewState.showSuccessState}
            savedSetId={previewState.savedSetId}
            onNavigateToEdit={onNavigateToEdit}
            onNavigateToStudy={onNavigateToStudy}
            onStartOver={onStartOver}
          />
        )}
      </div>
    </div>
  );
}
