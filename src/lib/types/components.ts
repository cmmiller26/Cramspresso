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

// === SHARED COMPONENT PROPS ===

// LoadingButton component props
export interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loadingText?: string;
}

// LoadingSpinner component props
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  overlay?: boolean;
}

// ButtonLoading component props
export interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

// InlineLoading component props
export interface InlineLoadingProps {
  text?: string;
}

// ErrorState component props
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

// StatsOverviewError component props
export interface StatsOverviewErrorProps {
  onRetry?: () => void;
}

// StudyModeError component props
export interface StudyModeErrorProps {
  onRetry?: () => void;
  onGoBack?: () => void;
}

// FileUploadError component props
export interface FileUploadErrorProps {
  error: string;
  onRetry?: () => void;
  onClear?: () => void;
}

// FileUploadWarning component props
export interface FileUploadWarningProps {
  message: string;
  onClear?: () => void;
}

// CancellationSuccess component props
export interface CancellationSuccessProps {
  message: string;
  onClear?: () => void;
}

// GenerationError component props
export interface GenerationErrorProps {
  error: string;
  onRetry?: () => void;
  onStartOver?: () => void;
}

// ReviewPageError component props
export interface ReviewPageErrorProps {
  error: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

// CardRefinementError component props
export interface CardRefinementErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// BulkImprovementsError component props
export interface BulkImprovementsErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// AISuggestionsError component props
export interface AISuggestionsErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// SkeletonLoader component props
export interface SkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circular";
}

export interface CardReviewSkeletonProps {
  count?: number;
}

export interface PageSkeletonProps {
  children: React.ReactNode;
}

// UploadZone component props
export interface UploadZoneProps {
  onClientUploadComplete: (files: unknown[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadBegin?: () => void;
  onUploadProgress?: (progress: number) => void;
  disabled?: boolean;
}

export interface UploadProgressData {
  progress: number;
  uploadSpeed: string;
  uploadedSize: string;
  totalSize: string;
  estimatedTime: string;
  fileName: string;
}

// === PAGE COMPONENT PROPS ===

// Dashboard component props
export interface StatsOverviewProps {
  sets: Array<{
    id: string;
    name: string;
    _count: { cards: number };
  }>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Set management component props  
export interface SetEditorProps {
  cards: Array<{
    id: string;
    question: string;
    answer: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  onAddCard: (card: { question: string; answer: string }) => Promise<void>;
  onUpdateCard: (
    cardId: string,
    updates: { question: string; answer: string }
  ) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  loading?: boolean;
}

// === EVENT HANDLER TYPES ===

export type AsyncEventHandler = () => Promise<void>;
export type SyncEventHandler = () => void;
export type ValueChangeHandler<T = string> = (value: T) => void;
export type ErrorHandler = (error: Error) => void;