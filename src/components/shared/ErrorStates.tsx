// src/components/shared/ErrorStates.tsx

import {
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  BookOpen,
  Target,
  Upload,
  FileText,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

// Generic error component
export function ErrorState({
  title = "Something went wrong",
  message = "Unable to load data. Please try again.",
  onRetry,
  showRetry = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 ${className}`}
    >
      <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// Specific error state that matches StatsOverview layout
export function StatsOverviewError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Show placeholder cards that match the real stats layout */}
      {[
        { title: "Total Sets", icon: BookOpen },
        { title: "Total Cards", icon: Target },
        { title: "This Week", icon: TrendingUp },
      ].map((stat, i) => (
        <div
          key={i}
          className="bg-card border border-destructive/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </span>
            <stat.icon className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center py-2">
            <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-xs text-destructive">Failed to load</p>
          </div>
        </div>
      ))}

      {/* Retry button spans all columns */}
      {onRetry && (
        <div className="md:col-span-3 text-center">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Stats
          </Button>
        </div>
      )}
    </div>
  );
}

// Set grid error state
export function SetGridError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="md:col-span-2 lg:col-span-3">
        <ErrorState
          title="Unable to load flashcard sets"
          message="There was a problem loading your sets. Check your connection and try again."
          onRetry={onRetry}
          className="py-12"
        />
      </div>
    </div>
  );
}

// Study mode error state
export function StudyModeError({
  onRetry,
  onGoBack,
}: {
  onRetry?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <div className="bg-card border border-destructive/20 rounded-lg p-8 text-center min-h-[400px] flex flex-col justify-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Unable to load study session
      </h3>
      <p className="text-muted-foreground mb-6">
        This flashcard set couldn&apos;t be loaded. It may have been deleted or
        you may not have permission to access it.
      </p>
      <div className="flex gap-3 justify-center">
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            Go Back
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// Create flow error state
export function CreateFlowError({
  onRetry,
  onStartOver,
  stage = "upload",
}: {
  onRetry?: () => void;
  onStartOver?: () => void;
  stage?: "upload" | "extraction" | "generation" | "review" | "save";
}) {
  const stageMessages = {
    upload: {
      title: "Upload failed",
      message: "There was a problem uploading your file. Please try again.",
      icon: Upload,
    },
    extraction: {
      title: "Text extraction failed",
      message:
        "We couldn't extract text from your file. Please try a different file or paste text directly.",
      icon: FileText,
    },
    generation: {
      title: "Generation failed",
      message:
        "We couldn't generate flashcards from your content. Please try again.",
      icon: Brain,
    },
    review: {
      title: "Review failed",
      message: "There was a problem loading the generated cards.",
      icon: FileText,
    },
    save: {
      title: "Save failed",
      message:
        "There was a problem saving your flashcard set. Please try again.",
      icon: FileText,
    },
  };

  const { title, message, icon: StageIcon } = stageMessages[stage];

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 py-12">
      <div className="p-3 bg-destructive/10 rounded-full mb-4">
        <StageIcon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      <div className="flex gap-3 justify-center">
        {onStartOver && (
          <Button onClick={onStartOver} variant="outline">
            Start Over
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// File upload specific error
export function FileUploadError({
  error,
  onRetry,
  onClear,
}: {
  error: string;
  onRetry?: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-destructive mb-1">Upload Error</h4>
          <p className="text-sm text-destructive/80 mb-3">{error}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onClear && (
              <Button onClick={onClear} variant="ghost" size="sm">
                Clear Error
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generation progress error
export function GenerationError({
  error,
  onRetry,
  onStartOver,
}: {
  error: string;
  onRetry?: () => void;
  onStartOver?: () => void;
}) {
  return (
    <div className="bg-card border border-destructive/20 rounded-lg p-6">
      <div className="text-center space-y-4">
        <div className="p-3 bg-destructive/10 rounded-full mx-auto w-fit">
          <Brain className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-medium text-foreground mb-2">
            Generation Failed
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {error}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          {onStartOver && (
            <Button onClick={onStartOver} variant="outline">
              Start Over
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Review page error
export function ReviewPageError({
  error,
  onRetry,
  onGoBack,
}: {
  error: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card border border-destructive/20 rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Unable to Load Review Page
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              Go Back to Create
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
