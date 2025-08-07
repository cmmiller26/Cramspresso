"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewPageError } from "@/components/shared/ErrorStates";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CardReviewSkeleton } from "@/components/shared/SkeletonLoader";
import { AISuggestions } from "@/components/create/AISuggestions";
import { BulkImprovements } from "@/components/create/BulkImprovements";
import { CardRefinement } from "@/components/create/CardRefinement";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Edit,
  Plus,
  Save,
  ArrowLeft,
  Lightbulb,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  Target,
  FileText,
  Users,
} from "lucide-react";
import { useReviewCards } from "@/hooks/create/useReviewCards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ReviewPage() {
  const {
    // State
    cards,
    loading,
    error,
    analysis,
    selectedCards,
    editStates,
    isSaving,
    saveProgress,

    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    updateEditState,

    // Refinement operations
    handleCardRefinement,
    isCardRegenerating,

    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,

    // Bulk improvement operations
    handleBulkImprovements,
    bulkImprovementsState,

    // AI suggestions
    aiSuggestions,

    // Save operations
    handleSaveSet,

    // Error handling
    clearError,
  } = useReviewCards();

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [setName, setSetName] = useState("");
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  const handleSaveDialogSubmit = async () => {
    if (!setName.trim()) return;

    try {
      await handleSaveSet(setName.trim());
    } catch (error) {
      console.error("Failed to save set:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <CardReviewSkeleton />
      </div>
    );
  }

  // Error state - FIXED: Better error handling
  if (error) {
    console.error("❌ DEBUG: Review page error detected", error);
    return (
      <ReviewPageError
        error={error}
        onRetry={clearError}
        onGoBack={() => window.history.back()}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Simplified Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Review & Edit Flashcards
            </h1>
            <p className="text-muted-foreground">
              {cards.length} cards ready. Edit, improve, and save your set.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addNewCard}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
          <LoadingButton
            onClick={() => setIsSaveDialogOpen(true)}
            loading={isSaving}
            loadingText="Saving..."
            disabled={cards.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Set
          </LoadingButton>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <div className="mb-6">
          {/* Success Banner */}
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {cards.length} flashcards generated successfully
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
                      >
                        {analysis.contentType}
                      </Badge>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {Math.round(analysis.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-800 dark:text-green-200">
                      {cards.length}
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-xs">
                      Cards
                    </div>
                  </div>
                  {analysis.contentGuidance && (
                    <div className="text-center">
                      <div className="font-bold text-green-800 dark:text-green-200 capitalize text-xs">
                        {analysis.contentGuidance.approach.replace("-", " ")}
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-xs">
                        Approach
                      </div>
                    </div>
                  )}
                  {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                    <div className="text-center">
                      <div className="font-bold text-green-800 dark:text-green-200">
                        {analysis.keyTopics.length}
                      </div>
                      <div className="text-green-600 dark:text-green-400 text-xs">
                        Topics
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expandable Analysis Details */}
          <Collapsible
            open={isAnalysisExpanded}
            onOpenChange={setIsAnalysisExpanded}
          >
            <Card className="border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Brain className="w-5 h-5 text-primary" />
                      Analysis Details
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        View breakdown
                      </span>
                      {isAnalysisExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        AI Summary:
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {analysis.summary}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Strategy:</strong> {analysis.reasoning}
                      </p>
                      {analysis.contentGuidance && (
                        <div className="text-xs text-muted-foreground bg-primary/5 rounded p-2">
                          <p>
                            <strong>Generation Approach:</strong>{" "}
                            {analysis.contentGuidance.approach.replace(
                              "-",
                              " "
                            )}
                          </p>
                          <p className="mt-1">
                            <strong>Expected Range:</strong>{" "}
                            {analysis.contentGuidance.expectedRange}
                          </p>
                          <p className="mt-1">
                            {analysis.contentGuidance.rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground mb-2 block">
                          Key Topics ({analysis.keyTopics.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {analysis.keyTopics.map((topic, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Terms */}
                  {analysis.vocabularyTerms &&
                    analysis.vocabularyTerms.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 mt-0.5 text-xs text-center bg-primary/10 rounded text-primary font-medium">
                          V
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground mb-2 block">
                            Vocabulary Terms Found (
                            {analysis.vocabularyTerms.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                            {analysis.vocabularyTerms
                              .slice(0, 15)
                              .map((term, index) => (
                                <div
                                  key={index}
                                  className="text-xs p-2 bg-muted/30 rounded"
                                >
                                  <span className="font-medium text-foreground">
                                    {term.term}
                                  </span>
                                  {term.definition && (
                                    <div className="text-muted-foreground mt-1">
                                      {term.definition.length > 40
                                        ? term.definition.substring(0, 40) +
                                          "..."
                                        : term.definition}
                                    </div>
                                  )}
                                </div>
                              ))}
                            {analysis.vocabularyTerms.length > 15 && (
                              <div className="text-xs text-muted-foreground p-2 flex items-center justify-center">
                                +{analysis.vocabularyTerms.length - 15} more
                                terms
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Question Focus Areas */}
                  {analysis.suggestedFocus &&
                    analysis.suggestedFocus.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Target className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground mb-2 block">
                            Question Focus Areas:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {analysis.suggestedFocus.map((focus, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {focus}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            AI focused on these question types when generating
                            your flashcards.
                          </p>
                        </div>
                      </div>
                    )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}

      {/* AI Suggestions - FIXED: Proper event handling */}
      <div className="mb-6">
        <AISuggestions
          suggestions={aiSuggestions.suggestions}
          isGenerating={aiSuggestions.isGenerating}
          error={aiSuggestions.error}
          onApplySuggestion={aiSuggestions.onApplySuggestion}
          onGenerateMore={aiSuggestions.onGenerateMore}
          onClearError={aiSuggestions.clearError}
        />
      </div>

      {/* Selection & Bulk Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAllCards}>
              <Users className="w-4 h-4 mr-2" />
              Select All
            </Button>
            {selectedCards.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear ({selectedCards.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkDeleteCards}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </>
            )}
          </div>
        </div>

        <BulkImprovements
          selectedCount={selectedCards.size}
          isImproving={bulkImprovementsState.isImproving}
          progress={bulkImprovementsState.progress}
          currentOperation={bulkImprovementsState.currentOperation}
          onImprove={handleBulkImprovements}
        />
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={`bg-card border-border transition-all duration-200 ${
              card.isNew ? "border-primary shadow-md" : ""
            } ${
              selectedCards.has(card.id)
                ? "ring-2 ring-primary bg-primary/5"
                : ""
            } ${isCardRegenerating(card.id) ? "opacity-75" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => {
                      console.log("🔍 DEBUG: Card selection toggled", {
                        cardId: card.id,
                      });
                      toggleCardSelection(card.id);
                    }}
                    className="rounded border-border"
                    disabled={isCardRegenerating(card.id)}
                  />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Card {index + 1}
                    {card.isNew && (
                      <Badge variant="secondary" className="ml-2">
                        New
                      </Badge>
                    )}
                    {isCardRegenerating(card.id) && (
                      <Badge variant="outline" className="ml-2 animate-pulse">
                        Improving...
                      </Badge>
                    )}
                  </CardTitle>
                </div>

                <div className="flex gap-2">
                  <CardRefinement
                    cardId={card.id}
                    isRegenerating={isCardRegenerating(card.id)}
                    onRegenerate={async (instruction) => {
                      console.log("🔍 DEBUG: Card refinement requested", {
                        cardId: card.id,
                        instruction,
                      });
                      await handleCardRefinement(card.id, instruction);
                    }}
                  />

                  {card.isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveCard(card.id)}
                        disabled={
                          !editStates[card.id]?.question.trim() ||
                          !editStates[card.id]?.answer.trim() ||
                          isCardRegenerating(card.id)
                        }
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEditing(card.id)}
                        disabled={isCardRegenerating(card.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(card.id)}
                        disabled={isCardRegenerating(card.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCard(card.id)}
                        disabled={isCardRegenerating(card.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Question */}
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  Question:
                  {isCardRegenerating(card.id) && <LoadingSpinner size="sm" />}
                </h4>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.question || ""}
                    onChange={(e) =>
                      updateEditState(card.id, "question", e.target.value)
                    }
                    placeholder="Enter the question..."
                    className="min-h-[80px] resize-none"
                    disabled={isCardRegenerating(card.id)}
                  />
                ) : (
                  <div
                    className={`text-muted-foreground bg-muted/30 p-3 rounded-lg transition-all duration-200 ${
                      isCardRegenerating(card.id) ? "animate-pulse" : ""
                    }`}
                  >
                    {card.question || (
                      <span className="italic text-muted-foreground/60">
                        Question content will appear here...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Answer */}
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  Answer:
                  {isCardRegenerating(card.id) && <LoadingSpinner size="sm" />}
                </h4>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.answer || ""}
                    onChange={(e) =>
                      updateEditState(card.id, "answer", e.target.value)
                    }
                    placeholder="Enter the answer..."
                    className="min-h-[80px] resize-none"
                    disabled={isCardRegenerating(card.id)}
                  />
                ) : (
                  <div
                    className={`text-muted-foreground bg-muted/30 p-3 rounded-lg transition-all duration-200 ${
                      isCardRegenerating(card.id) ? "animate-pulse" : ""
                    }`}
                  >
                    {card.answer || (
                      <span className="italic text-muted-foreground/60">
                        Answer content will appear here...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Regeneration Status */}
              {isCardRegenerating(card.id) && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <LoadingSpinner size="sm" />
                    <span>
                      AI is improving this card based on your instructions...
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-12 text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No flashcards to review
            </h3>
            <p className="text-muted-foreground mb-4">
              It looks like there are no cards to review. Try generating some
              flashcards first.
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Create
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Flashcard Set</DialogTitle>
            <DialogDescription>
              Give your flashcard set a name to save it to your dashboard.
            </DialogDescription>
          </DialogHeader>

          {isSaving ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saving your set...</span>
                <span className="text-sm text-muted-foreground">
                  {saveProgress}%
                </span>
              </div>
              <Progress value={saveProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Creating {cards.length} flashcards in your dashboard
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="e.g., Biology Chapter 5 Vocabulary"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && setName.trim()) {
                      handleSaveDialogSubmit();
                    }
                  }}
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Cards to save:</span>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                {analysis && (
                  <>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Content type:</span>
                      <Badge variant="outline" className="capitalize">
                        {analysis.contentType}
                      </Badge>
                    </div>
                    {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                      <div className="text-sm mt-2">
                        <span className="text-muted-foreground">Topics: </span>
                        <span className="text-foreground">
                          {analysis.keyTopics.slice(0, 3).join(", ")}
                          {analysis.keyTopics.length > 3 &&
                            ` (+${analysis.keyTopics.length - 3} more)`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {!isSaving && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSaveDialogOpen(false);
                  setSetName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDialogSubmit}
                disabled={!setName.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Set
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
