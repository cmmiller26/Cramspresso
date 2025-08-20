import type {
  ContentAnalysis,
  FlowStep,
} from "./create";

// === BASE COMPONENT PROPS ===

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface StepComponentProps extends BaseComponentProps {
  onNext?: () => void;
  onBack?: () => void;
  disabled?: boolean;
}

// === UPLOAD COMPONENT PROPS ===

export interface UploadStepProps extends StepComponentProps {
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onTextInput: (text: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  isExtracting: boolean;
  error?: string;
  onClearError: () => void;
}

export interface FileUploaderProps extends BaseComponentProps {
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  disabled?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
}

// === GENERATION COMPONENT PROPS ===

export interface GenerationStepProps extends StepComponentProps {
  progress: number;
  stage: string;
  currentStageDescription: string;
  error?: string;
  canCancel: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onStartOver: () => void;
}

export interface AnalysisDisplayProps extends BaseComponentProps {
  analysis: ContentAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
  showExpandButton?: boolean;
  compact?: boolean;
  highlightMetrics?: boolean;
}

// === COMPLETION COMPONENT PROPS ===

export interface CompletionStepProps extends StepComponentProps {
  cardCount: number;
  contentType?: string;
  onRedirect: () => void;
  onCreateAnother?: () => void;
  autoRedirect?: boolean;
  redirectDelay?: number;
}

// === FLOW PROGRESS PROPS ===

export interface FlowProgressIndicatorProps extends BaseComponentProps {
  currentStep: FlowStep;
  steps?: Array<{
    step: FlowStep;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
  }>;
  showLabels?: boolean;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}

// === COMMON PROP COMBINATIONS ===

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
}

// === EVENT HANDLER TYPES ===

export type AsyncEventHandler = () => Promise<void>;
export type SyncEventHandler = () => void;
export type ValueChangeHandler<T = string> = (value: T) => void;
export type ErrorHandler = (error: Error) => void;