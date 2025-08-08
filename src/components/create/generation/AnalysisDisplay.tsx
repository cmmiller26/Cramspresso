import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  FileText,
  Target,
  Clock,
  BarChart3,
} from "lucide-react";
import type { AnalysisDisplayProps } from "@/lib/types/components";

export function AnalysisDisplay({
  analysis,
  isExpanded,
  onToggle,
  showExpandButton = true,
  compact = false,
  highlightMetrics = false,
  className = "",
}: AnalysisDisplayProps) {
  const metrics = [
    {
      label: "Content Type",
      value:
        analysis.contentType === "vocabulary"
          ? "Vocabulary"
          : analysis.contentType === "concepts"
          ? "Concepts"
          : analysis.contentType === "mixed"
          ? "Mixed Content"
          : "Other",
      icon: FileText,
      description: "Detected content format",
    },
    {
      label: "Approach",
      value:
        analysis.contentGuidance?.approach === "one-per-term"
          ? "One per Term"
          : analysis.contentGuidance?.approach === "concept-coverage"
          ? "Concept Coverage"
          : analysis.contentGuidance?.approach === "balanced"
          ? "Balanced"
          : "Standard",
      icon: Target,
      description: "Generation strategy used",
    },
    {
      label: "Expected Range",
      value: analysis.contentGuidance?.expectedRange || "Variable",
      icon: Clock,
      description: "Expected number of cards",
    },
    {
      label: "Key Topics",
      value: analysis.keyTopics?.length || 0,
      icon: BarChart3,
      description: "Main topics identified",
    },
  ];

  if (compact) {
    return (
      <Card className={`border-primary/20 bg-primary/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">
                AI Analysis Complete
              </span>
            </div>
            {showExpandButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-primary hover:bg-primary/10"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} compact={true} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Brain className="w-5 h-5" />
            AI Content Analysis
          </CardTitle>
          {showExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-primary hover:bg-primary/10"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick summary */}
        <div className="p-4 bg-background/50 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Analysis Summary:</strong> {analysis.summary}
          </p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              {...metric}
              highlighted={highlightMetrics}
            />
          ))}
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Key Topics */}
            {analysis.keyTopics && analysis.keyTopics.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Key Topics Identified:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.keyTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vocabulary Terms */}
            {analysis.vocabularyTerms &&
              analysis.vocabularyTerms.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Vocabulary Terms ({analysis.vocabularyTerms.length}):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.vocabularyTerms
                      .slice(0, 6)
                      .map((vocab, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-background border border-border rounded-lg"
                        >
                          <div className="text-sm font-medium text-foreground">
                            {vocab.term}
                          </div>
                          {vocab.definition && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {vocab.definition}
                            </div>
                          )}
                        </div>
                      ))}
                    {analysis.vocabularyTerms.length > 6 && (
                      <div className="text-xs text-muted-foreground col-span-full">
                        +{analysis.vocabularyTerms.length - 6} more terms
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Content Guidance */}
            {analysis.contentGuidance && (
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Generation Strategy:
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Approach:</strong>{" "}
                    {analysis.contentGuidance.approach}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Rationale:</strong>{" "}
                    {analysis.contentGuidance.rationale}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Expected Range:</strong>{" "}
                    {analysis.contentGuidance.expectedRange}
                  </p>
                </div>
              </div>
            )}

            {/* Suggested Focus */}
            {analysis.suggestedFocus && analysis.suggestedFocus.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Suggested Focus Areas:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggestedFocus.map((focus, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-800"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reasoning */}
            {analysis.reasoning && (
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  AI Reasoning:
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                  {analysis.reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  highlighted?: boolean;
  compact?: boolean;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  highlighted = false,
  compact = false,
}: MetricCardProps) {
  return (
    <div
      className={`
      p-3 rounded-lg border transition-colors
      ${
        highlighted
          ? "bg-primary/10 border-primary/30"
          : "bg-background border-border"
      }
      ${compact ? "text-center" : ""}
    `}
    >
      <div
        className={`flex items-center gap-2 mb-1 ${
          compact ? "justify-center" : ""
        }`}
      >
        <Icon
          className={`w-4 h-4 ${
            highlighted ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div
        className={`font-semibold text-foreground ${
          compact ? "text-center" : ""
        }`}
      >
        {typeof value === "number" && value > 0 ? `${value}` : value}
      </div>
      {description && !compact && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
