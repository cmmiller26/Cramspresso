import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Save, Sparkles } from "lucide-react";
import type { SaveDialogProps } from "@/lib/types/components";
import type { ContentAnalysis } from "@/lib/types/create";

export function SaveSetDialog({
  isOpen,
  onClose,
  onSave,
  isSaving,
  saveProgress,
  cardCount,
  analysis,
  defaultName = "",
  className = "",
}: SaveDialogProps) {
  const [setName, setSetName] = React.useState(defaultName);
  const [nameError, setNameError] = React.useState("");

  React.useEffect(() => {
    if (isOpen && !defaultName) {
      // Generate a smart default name based on analysis
      const suggestedName = generateDefaultName(analysis, cardCount);
      setSetName(suggestedName);
    }
  }, [isOpen, analysis, cardCount, defaultName]);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError("Set name is required");
      return false;
    }
    if (name.trim().length < 3) {
      setNameError("Set name must be at least 3 characters");
      return false;
    }
    if (name.trim().length > 100) {
      setNameError("Set name cannot exceed 100 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateName(setName)) {
      return;
    }

    try {
      await onSave(setName.trim());
    } catch (error) {
      console.error("Save failed:", error);
      // Error handling managed by parent component
    }
  };

  const handleNameChange = (value: string) => {
    setSetName(value);
    if (nameError && value.trim().length >= 3) {
      setNameError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            Save Flashcard Set
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Set name input */}
          <div className="space-y-2">
            <Label htmlFor="set-name">Set Name</Label>
            <Input
              id="set-name"
              value={setName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter a name for your flashcard set..."
              disabled={isSaving}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          {/* Set summary */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cards:</span>
              <span className="font-medium">{cardCount}</span>
            </div>
            {analysis?.contentType && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Content Type:</span>
                <span className="font-medium">
                  {analysis.contentType === "vocabulary"
                    ? "Vocabulary"
                    : analysis.contentType === "concepts"
                    ? "Concepts"
                    : analysis.contentType === "mixed"
                    ? "Mixed Content"
                    : "Other"}
                </span>
              </div>
            )}
            {analysis?.contentGuidance?.approach && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approach:</span>
                <span className="font-medium">
                  {analysis.contentGuidance.approach === "one-per-term"
                    ? "One per Term"
                    : analysis.contentGuidance.approach === "concept-coverage"
                    ? "Concept Coverage"
                    : "Balanced"}
                </span>
              </div>
            )}
            {analysis?.keyTopics && analysis.keyTopics.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Key Topics:</span>
                <span className="font-medium">{analysis.keyTopics.length}</span>
              </div>
            )}
            {analysis?.vocabularyTerms &&
              analysis.vocabularyTerms.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Vocabulary Terms:
                  </span>
                  <span className="font-medium">
                    {analysis.vocabularyTerms.length}
                  </span>
                </div>
              )}
          </div>

          {/* Save progress */}
          {isSaving && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saving progress:</span>
                <span className="font-medium">{Math.round(saveProgress)}%</span>
              </div>
              <Progress value={saveProgress} className="h-2" />
            </div>
          )}

          {/* Tips for naming */}
          {!isSaving && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Naming Tips
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Include the subject, topic, or chapter for easy organization
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSave}
            loading={isSaving}
            disabled={!setName.trim() || !!nameError}
            loadingText={`Saving... ${Math.round(saveProgress)}%`}
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Set
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateDefaultName(
  analysis: ContentAnalysis | null,
  cardCount?: number
): string {
  const currentDate = new Date().toLocaleDateString();

  if (analysis?.keyTopics?.[0] && analysis?.contentType) {
    const topic = analysis.keyTopics[0];
    const type =
      analysis.contentType === "vocabulary"
        ? "Vocabulary"
        : analysis.contentType === "concepts"
        ? "Concepts"
        : analysis.contentType === "mixed"
        ? "Mixed"
        : "Study";
    return `${topic} - ${type} Cards`;
  }

  if (analysis?.contentType) {
    const type =
      analysis.contentType === "vocabulary"
        ? "Vocabulary"
        : analysis.contentType === "concepts"
        ? "Concepts"
        : analysis.contentType === "mixed"
        ? "Mixed Content"
        : "Study";
    return `${type} Flashcards - ${currentDate}`;
  }

  if (cardCount) {
    return `Study Set (${cardCount} cards) - ${currentDate}`;
  }

  return `Flashcard Set - ${currentDate}`;
}
