import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { CardRefinement } from "@/components/create/cards/CardRefinement";
import { useLoadingState } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { Edit3, Save, X, Trash2, RotateCcw } from "lucide-react";
import type { CardEditorProps } from "@/lib/types/components";

export const CardEditor = React.memo(function CardEditor({
  card,
  editState,
  isEditing,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onUpdateField,
  isSelected = false,
  onToggleSelection,
  onRefineCard,
  isRegenerating = false,
  disabled = false,
  showValidation = true,
  showSelection = true,
  className = "",
}: CardEditorProps) {
  const { isLoading } = useLoadingState(["save-card", "delete-card"]);
  const { renderError } = useErrorHandler();

  const hasChanges =
    isEditing &&
    editState &&
    (editState.question !== card.question || editState.answer !== card.answer);

  const isValid = editState
    ? editState.question.trim().length >= 5 &&
      editState.answer.trim().length >= 3
    : true;

  const handleSave = async () => {
    if (!isValid || !hasChanges) return;
    await onSave();
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      await onDelete();
    }
  };

  return (
    <Card
      className={`
      ${className} 
      ${isSelected ? "ring-2 ring-primary" : ""} 
      ${isEditing ? "ring-1 ring-blue-300" : ""}
      ${isRegenerating ? "opacity-75" : ""}
    `}
    >
      <CardContent className="p-4">
        {/* Error Display */}
        {renderError()}

        <div className="space-y-4">
          {/* Header with selection and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showSelection && onToggleSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(card.id)}
                  disabled={disabled || isRegenerating}
                />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                Card #{card.id.slice(-4)}
              </span>
              {card.isNew && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isRegenerating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Improving...
                </div>
              )}

              {!isEditing && !isRegenerating && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    disabled={disabled}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {onRefineCard && (
                    <CardRefinement
                      cardId={card.id}
                      isRegenerating={isRegenerating}
                      onRegenerate={onRefineCard}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={disabled || isLoading("delete-card")}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              {isEditing && (
                <div className="flex items-center gap-2">
                  <LoadingButton
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasChanges || !isValid}
                    loading={isLoading("save-card")}
                    loadingText="Saving..."
                  >
                    <Save className="w-4 h-4" />
                  </LoadingButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isLoading("save-card")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Question
            </label>
            {isEditing && editState ? (
              <div>
                <Textarea
                  value={editState.question}
                  onChange={(e) => onUpdateField("question", e.target.value)}
                  placeholder="Enter your question..."
                  className="min-h-[60px] resize-none"
                  disabled={disabled || isRegenerating}
                />
                {showValidation && editState.question.trim().length < 5 && (
                  <p className="text-xs text-destructive mt-1">
                    Question must be at least 5 characters long
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/30 rounded-lg border">
                <p className="text-foreground whitespace-pre-wrap">
                  {card.question}
                </p>
              </div>
            )}
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Answer
            </label>
            {isEditing && editState ? (
              <div>
                <Textarea
                  value={editState.answer}
                  onChange={(e) => onUpdateField("answer", e.target.value)}
                  placeholder="Enter your answer..."
                  className="min-h-[80px] resize-none"
                  disabled={disabled || isRegenerating}
                />
                {showValidation && editState.answer.trim().length < 3 && (
                  <p className="text-xs text-destructive mt-1">
                    Answer must be at least 3 characters long
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/30 rounded-lg border">
                <p className="text-foreground whitespace-pre-wrap">
                  {card.answer}
                </p>
              </div>
            )}
          </div>

          {/* Edit status indicator */}
          {isEditing && hasChanges && (
            <div className="text-xs text-muted-foreground italic">
              Unsaved changes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
