"use client";

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { AnalysisDisplay } from "@/components/create/generation/AnalysisDisplay";
import { CheckCircle, Edit, Play, RotateCcw } from "lucide-react";
import type { GeneratedCard } from "@/lib/types/flashcards";
import type { ContentAnalysis } from "@/lib/types/create";

interface PreviewStepProps {
  cards: GeneratedCard[];
  analysis: ContentAnalysis | null;
  onSave: (setName: string) => Promise<void>;
  isSaving: boolean;
  saveProgress: number;
  error?: string;
  isAnalysisExpanded: boolean;
  onToggleAnalysis: () => void;
  showSuccessState: boolean;
  savedSetId?: string;
  onNavigateToEdit: () => void;
  onNavigateToStudy: () => void;
  onStartOver: () => void;
}

export const PreviewStep = memo(function PreviewStep({
  cards,
  analysis,
  onSave,
  isSaving,
  saveProgress,
  error,
  isAnalysisExpanded,
  onToggleAnalysis,
  showSuccessState,
  savedSetId,
  onNavigateToEdit,
  onNavigateToStudy,
  onStartOver,
}: PreviewStepProps) {
  const [setName, setSetName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const validateAndSave = async () => {
    const trimmedName = setName.trim();
    
    if (!trimmedName) {
      setNameError("Set name is required");
      return;
    }
    
    if (trimmedName.length > 100) {
      setNameError("Set name cannot exceed 100 characters");
      return;
    }

    setNameError(null);
    await onSave(trimmedName);
  };

  // Success State
  if (showSuccessState && savedSetId) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Flashcard Set Created!
            </h2>
            <p className="text-lg text-muted-foreground">
              Your set <span className="font-semibold">&ldquo;{setName}&rdquo;</span> has been saved with{" "}
              <span className="font-semibold">{cards.length} flashcards</span>.
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <LoadingButton 
            onClick={onNavigateToEdit}
            className="gap-2"
            variant="default"
          >
            <Edit className="w-4 h-4" />
            Edit Cards
          </LoadingButton>
          <LoadingButton 
            onClick={onNavigateToStudy}
            className="gap-2"
            variant="secondary"
          >
            <Play className="w-4 h-4" />
            Start Studying
          </LoadingButton>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={onStartOver}
            variant="ghost"
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            Create Another Set
          </Button>
        </div>
      </div>
    );
  }

  // Preview State
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Preview Your Flashcards
        </h2>
        <p className="text-muted-foreground">
          Review your {cards.length} generated flashcards and analysis
        </p>
      </div>

      {/* Content Analysis */}
      {analysis && (
        <AnalysisDisplay
          analysis={analysis}
          isExpanded={isAnalysisExpanded}
          onToggle={onToggleAnalysis}
          showExpandButton={true}
          compact={false}
        />
      )}

      {/* Set Name Input */}
      <Card>
        <CardHeader>
          <CardTitle>Name Your Set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setName">Set Name</Label>
            <Input
              id="setName"
              type="text"
              placeholder="Enter a name for your flashcard set"
              value={setName}
              onChange={(e) => {
                setSetName(e.target.value);
                if (nameError) setNameError(null);
              }}
              className={nameError ? "border-destructive" : ""}
              disabled={isSaving}
              maxLength={100}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {cards.length} flashcard{cards.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <LoadingButton
              onClick={validateAndSave}
              loading={isSaving}
              loadingText={`Saving... ${saveProgress > 0 ? `${Math.round(saveProgress)}%` : ""}`}
              disabled={!setName.trim() || isSaving}
            >
              Save Flashcard Set
            </LoadingButton>
          </div>
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Generated Flashcards
        </h3>
        <div className="grid gap-4">
          {cards.map((card, index) => (
            <Card key={card.id || index} className="border-border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Card Number */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Card {index + 1}
                    </Badge>
                  </div>
                  
                  {/* Question */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Question
                    </Label>
                    <div className="p-3 rounded-md bg-muted/50 border">
                      <p className="text-sm text-foreground">{card.question}</p>
                    </div>
                  </div>
                  
                  {/* Answer */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Answer
                    </Label>
                    <div className="p-3 rounded-md bg-muted/50 border">
                      <p className="text-sm text-foreground">{card.answer}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});