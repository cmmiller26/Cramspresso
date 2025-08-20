import type {
  ContentAnalysis,
  FlowStep,
  CardEditState,
  AISuggestion,
  BulkImprovementType,
  OperationState,
} from "./create";
import { ReviewFlashcard } from "./flashcards";

// === BASE COMPONENT PROPS ===

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface StepComponentProps extends BaseComponentProps {
  onNext?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

export interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// === UPLOAD STEP PROPS ===

export interface UploadStepProps extends StepComponentProps {
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onTextInput: (text: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  isExtracting?: boolean;
  extractionProgress?: number;
}

export interface FileUploaderProps extends BaseComponentProps {
  onFileUploaded: (url: string, fileName: string) => Promise<void>;
  onTextInput: (text: string) => Promise<void>;
  onUploadCancelled?: (fileUrl?: string) => void;
  isExtracting?: boolean;
  extractionProgress?: number;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export interface TextInputAreaProps extends BaseComponentProps {
  onTextSubmit: (text: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
}

// === GENERATION STEP PROPS ===

export interface GenerationStepProps extends StepComponentProps {
  progress: number;
  stage: string;
  currentStageDescription: string;
  canCancel: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onStartOver: () => void;
  contentType?: string;
  contentHint?: string;
  estimatedTimeRemaining?: number;
}

export interface ProgressDisplayProps extends BaseComponentProps {
  progress: number;
  stage: string;
  description: string;
  showPercentage?: boolean;
  showStageLabel?: boolean;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

// === COMPLETION STEP PROPS ===

export interface CompletionStepProps extends StepComponentProps {
  cardCount: number;
  contentType?: string;
  onRedirect: () => void;
  onCreateAnother?: () => void;
  autoRedirect?: boolean;
  redirectDelay?: number;
}

// === CARD MANAGEMENT PROPS ===

export interface CardOperationProps extends BaseComponentProps {
  card: ReviewFlashcard;
  onSave: (card: ReviewFlashcard) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onStartEdit: (cardId: string) => void;
  onCancelEdit: (cardId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface CardEditorProps extends BaseComponentProps {
  card: ReviewFlashcard;
  editState: CardEditState;
  isEditing: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onUpdateField: (field: "question" | "answer", value: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (cardId: string) => void;
  onRefineCard?: (instruction: string) => Promise<void>;
  isRegenerating?: boolean;
  disabled?: boolean;
  showValidation?: boolean;
  showSelection?: boolean;
}

export interface CardDisplayProps extends BaseComponentProps {
  card: ReviewFlashcard;
  index: number;
  isSelected?: boolean;
  isEditing?: boolean;
  isRegenerating?: boolean;
  onToggleSelection?: (cardId: string) => void;
  showSelection?: boolean;
  compact?: boolean;
}

// === SELECTION CONTROL PROPS ===

export interface SelectionControlsProps extends BaseComponentProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  disabled?: boolean;
  showSelectAll?: boolean;
  showBulkActions?: boolean;
}

// === AI SUGGESTIONS PROPS ===

export interface AISuggestionsProps extends BaseComponentProps {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  error?: string | null;
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  onGenerateMore: () => Promise<void>;
  onClearError: () => void;
  maxSuggestions?: number;
  showGenerateButton?: boolean;
}

export interface SuggestionCardProps extends BaseComponentProps {
  suggestion: AISuggestion;
  onApply: (suggestion: AISuggestion) => Promise<void>;
  isApplying?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

// === BULK IMPROVEMENT PROPS ===

export interface BulkImprovementsProps extends BaseComponentProps {
  selectedCount: number;
  isImproving: boolean;
  progress: number;
  currentOperation: string;
  onImprove: (
    improvement: BulkImprovementType,
    customInstruction?: string,
    targetCardCount?: number
  ) => Promise<void>;
  disabled?: boolean;
  showProgress?: boolean;
}

export interface ImprovementOptionProps extends BaseComponentProps {
  type: BulkImprovementType;
  label: string;
  description: string;
  onSelect: (type: BulkImprovementType) => void;
  selected?: boolean;
  disabled?: boolean;
  requiresTargetCount?: boolean;
}

// === CARD REFINEMENT PROPS ===

export interface CardRefinementProps extends BaseComponentProps {
  cardId: string;
  isRegenerating: boolean;
  onRegenerate: (instruction: string) => Promise<void>;
  disabled?: boolean;
  showQuickActions?: boolean;
  customInstructions?: string[];
}

export interface RefinementInstructionProps extends BaseComponentProps {
  instruction: string;
  description?: string;
  onApply: (instruction: string) => void;
  disabled?: boolean;
  variant?: "default" | "quick" | "custom";
}

// === ANALYSIS DISPLAY PROPS ===

export interface AnalysisDisplayProps extends BaseComponentProps {
  analysis: ContentAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
  showExpandButton?: boolean;
  compact?: boolean;
  highlightMetrics?: boolean;
}

export interface AnalysisMetricProps extends BaseComponentProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "info";
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

export interface StepIndicatorProps extends BaseComponentProps {
  step: FlowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCompleted: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

// === SAVE DIALOG PROPS ===

export interface SaveDialogProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (setName: string) => Promise<void>;
  isSaving: boolean;
  saveProgress: number;
  cardCount: number;
  analysis: ContentAnalysis | null;
  defaultName?: string;
}

export interface SaveProgressProps extends BaseComponentProps {
  progress: number;
  stage: string;
  cardCount: number;
  showDetails?: boolean;
  animated?: boolean;
}

// === VALIDATION DISPLAY PROPS ===

export interface ValidationMessageProps extends BaseComponentProps {
  errors: Array<{ field: string; message: string }>;
  type: "error" | "warning" | "info";
  showIcon?: boolean;
  compact?: boolean;
}

export interface FieldValidationProps extends BaseComponentProps {
  field: string;
  value: string;
  rules: Array<{
    test: (value: string) => boolean;
    message: string;
  }>;
  showOnFocus?: boolean;
  showOnChange?: boolean;
}

// === ACTION BUTTON GROUP PROPS ===

export interface ActionButtonGroupProps extends BaseComponentProps {
  primaryAction: {
    label: string;
    onClick: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary";
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  spacing?: "tight" | "normal" | "loose";
}

// === OPERATION STATUS PROPS ===

export interface OperationStatusProps extends BaseComponentProps {
  operation: OperationState;
  title: string;
  description?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  showProgress?: boolean;
  showCancel?: boolean;
  showRetry?: boolean;
  variant?: "default" | "compact" | "detailed";
}

// === TIPS AND HELP PROPS ===

export interface TipsCardProps extends BaseComponentProps {
  title: string;
  tips: string[];
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "info" | "success" | "warning";
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface HelpTooltipProps extends BaseComponentProps {
  content: string;
  title?: string;
  placement?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "focus";
  showIcon?: boolean;
}

// === KEYBOARD SHORTCUTS PROPS ===

export interface KeyboardShortcutsProps extends BaseComponentProps {
  shortcuts: Array<{
    key: string;
    description: string;
    action: () => void;
  }>;
  isVisible: boolean;
  onToggle: () => void;
  scope?: "global" | "component";
}

// === RESPONSIVE LAYOUT PROPS ===

export interface ResponsiveContainerProps extends BaseComponentProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  centerContent?: boolean;
  fullHeight?: boolean;
}

export interface GridLayoutProps extends BaseComponentProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  autoFit?: boolean;
  minItemWidth?: string;
}

// === ACCESSIBILITY PROPS ===

export interface AccessibilityProps {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-hidden"?: boolean;
  "aria-live"?: "off" | "polite" | "assertive";
  role?: string;
  tabIndex?: number;
  id?: string;
}

// === THEME AND STYLING PROPS ===

export interface ThemeProps {
  theme?: "light" | "dark" | "system";
  colorScheme?: "default" | "blue" | "green" | "purple" | "orange";
  density?: "compact" | "normal" | "comfortable";
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
}

// === ANIMATION PROPS ===

export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  transition?: string;
}

// === COMMON PROP COMBINATIONS ===

export interface InteractiveComponentProps
  extends BaseComponentProps,
    AccessibilityProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface FormComponentProps extends InteractiveComponentProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValidate?: (value: string) => string | null;
  required?: boolean;
  placeholder?: string;
}

export interface StylableComponentProps
  extends BaseComponentProps,
    ThemeProps,
    AnimationProps {
  variant?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

// === EVENT HANDLER TYPES ===

export type AsyncEventHandler = () => Promise<void>;
export type SyncEventHandler = () => void;
export type ValueChangeHandler<T = string> = (value: T) => void;
export type ValidationHandler = (value: string) => string | null;
export type ErrorHandler = (error: Error) => void;
export type ProgressHandler = (progress: number) => void;
