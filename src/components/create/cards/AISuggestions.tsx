import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Lightbulb,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  Target,
  BookOpen,
  Zap,
  RefreshCw,
} from "lucide-react";
import type { AISuggestion } from "@/lib/types/create";

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  error?: string | null;
  onApplySuggestion: (suggestion: AISuggestion) => Promise<void>;
  onGenerateMore: () => void;
  onClearError?: () => void;
}

const getSuggestionIcon = (type: AISuggestion["type"]) => {
  switch (type) {
    case "difficulty":
      return <TrendingUp className="w-4 h-4" />;
    case "coverage":
      return <Plus className="w-4 h-4" />;
    case "examples":
      return <BookOpen className="w-4 h-4" />;
    case "clarity":
      return <AlertCircle className="w-4 h-4" />;
    case "count":
      return <Target className="w-4 h-4" />;
    default:
      return <Lightbulb className="w-4 h-4" />;
  }
};

const getPriorityStyles = (priority: AISuggestion["priority"]) => {
  switch (priority) {
    case "high":
      return {
        container:
          "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        badge:
          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
        button:
          "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950",
      };
    case "medium":
      return {
        container:
          "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800",
        text: "text-yellow-800 dark:text-yellow-200",
        badge:
          "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
        button:
          "border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950",
      };
    case "low":
      return {
        container:
          "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-200",
        badge:
          "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
        button:
          "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950",
      };
  }
};

export function AISuggestions({
  suggestions,
  isGenerating,
  error,
  onApplySuggestion,
  onGenerateMore,
  onClearError,
}: AISuggestionsProps) {
  // Error state
  if (error && onClearError) {
    return (
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive mb-1">
                AI Suggestions Failed
              </h4>
              <p className="text-sm text-destructive/80 mb-3">{error}</p>
              <div className="flex gap-2">
                <Button onClick={onGenerateMore} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={onClearError} variant="ghost" size="sm">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground">
                🤖 Analyzing your cards for improvement suggestions...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a moment while AI reviews your content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-6 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground/60" />
          <h3 className="font-medium text-foreground mb-2">
            No suggestions available
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your flashcards look great! We couldn&apos;t find any obvious
            improvements right now.
          </p>
          <Button variant="outline" size="sm" onClick={onGenerateMore}>
            <Zap className="w-4 h-4 mr-2" />
            Analyze Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main suggestions display
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950/50 dark:to-purple-950/50 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Lightbulb className="w-5 h-5" />
          🎯 AI Improvement Suggestions
        </CardTitle>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Based on analysis of your content and flashcards
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => {
          const styles = getPriorityStyles(suggestion.priority);

          return (
            <div
              key={suggestion.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${styles.container}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-1.5 rounded-md ${styles.container}`}>
                    {getSuggestionIcon(suggestion.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-medium text-sm ${styles.text}`}>
                        {suggestion.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${styles.badge}`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <p className={`text-xs ${styles.text} opacity-80`}>
                      {suggestion.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {suggestion.applied ? (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Applied</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplySuggestion(suggestion)}
                      className={`text-xs h-8 px-3 ${styles.button}`}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Generate More Button */}
        <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateMore}
              disabled={isGenerating}
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Analyzing Cards...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate More Suggestions
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2">
            {isGenerating
              ? "AI is analyzing your cards for fresh improvement ideas..."
              : "AI will analyze your cards again for additional improvements"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
