"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { CardReviewSkeleton } from "@/components/shared/SkeletonLoader";
import { ReviewPageError } from "@/components/shared/ErrorStates";
import { useReviewCards } from "@/hooks/create/useReviewCards";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  Zap,
  Target,
  Brain,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type ViewMode = "preview" | "edit";

export default function ReviewPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [setName, setSetName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const {
    cards,
    loading,
    error,
    analysis,
    selectedCards,
    editStates,
    bulkOperationLoading,
    isSaving,
    saveProgress,
    // Card operations
    startEditing,
    cancelEditing,
    saveCard,
    deleteCard,
    addNewCard,
    improveCard,
    updateEditState,
    // Selection operations
    toggleCardSelection,
    selectAllCards,
    clearSelection,
    bulkDeleteCards,
    bulkImproveCards,
    // Save operations
    handleSaveSet,
    // Error handling
    clearError,
  } = useReviewCards();

  // Show skeleton while loading
  if (loading) {
    return <CardReviewSkeleton count={5} />;
  }

  // Show error page if there's a major error
  if (error && cards.length === 0) {
    return (
      <ReviewPageError
        error={error}
        onRetry={() => window.location.reload()}
        onGoBack={() => router.push("/create")}
      />
    );
  }

  const handleSave = async () => {
    if (!setName.trim()) return;
    await handleSaveSet(setName.trim());
    setShowSaveDialog(false);
  };

  const handleImproveCard = async (cardId: string, instruction: string) => {
    await improveCard(cardId, instruction);
  };

  const handleBulkImprove = async (instruction: string) => {
    await bulkImproveCards(instruction);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/create" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Create
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Review & Refine Flashcards
            </h1>
            <p className="text-muted-foreground">
              {cards.length} flashcards generated • Edit, improve, or add new
              cards before saving
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("edit")}
            >
              Edit Mode
            </Button>
          </div>
        </div>

        {/* Analysis Summary */}
        {analysis && (
          <Card className="bg-primary/5 border-primary/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Target className="w-5 h-5" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {cards.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cards Generated
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground capitalize">
                    {analysis.contentType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Content Type
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(analysis.confidence * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {analysis.keyTopics.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Key Topics
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {analysis.reasoning}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {error && cards.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2 h-auto p-0 text-destructive hover:text-destructive"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions Bar */}
      {viewMode === "edit" && (
        <Card className="mb-6 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {selectedCards.size > 0 ? (
                    <span className="font-medium text-foreground">
                      {selectedCards.size} card
                      {selectedCards.size !== 1 ? "s" : ""} selected
                    </span>
                  ) : (
                    "Select cards for bulk actions"
                  )}
                </div>

                {selectedCards.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear Selection
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={bulkOperationLoading}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Improve Selected
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() =>
                            handleBulkImprove("make more challenging")
                          }
                        >
                          Make More Challenging
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBulkImprove("add examples")}
                        >
                          Add Examples
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBulkImprove("simplify language")}
                        >
                          Simplify Language
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleBulkImprove("focus on key terms")
                          }
                        >
                          Focus on Key Terms
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={bulkDeleteCards}
                      disabled={bulkOperationLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {cards.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllCards}
                    disabled={selectedCards.size === cards.length}
                  >
                    Select All
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={addNewCard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={`bg-card border-border ${
              selectedCards.has(card.id) ? "ring-2 ring-primary" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {viewMode === "edit" && (
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={() => toggleCardSelection(card.id)}
                      className="w-4 h-4 text-primary"
                    />
                  )}
                  <Badge variant="secondary">Card {index + 1}</Badge>
                  {card.isNew && <Badge variant="default">New</Badge>}
                </div>

                <div className="flex items-center gap-1">
                  {viewMode === "edit" && !card.isEditing && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Zap className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleImproveCard(
                                card.id,
                                "make more challenging"
                              )
                            }
                          >
                            Make More Challenging
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleImproveCard(card.id, "add examples")
                            }
                          >
                            Add Examples
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleImproveCard(card.id, "simplify language")
                            }
                          >
                            Simplify Language
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleImproveCard(card.id, "be more specific")
                            }
                          >
                            Be More Specific
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(card.id)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCard(card.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  {card.isEditing && (
                    <>
                      <LoadingButton
                        variant="ghost"
                        size="sm"
                        onClick={() => saveCard(card.id)}
                        disabled={
                          !editStates[card.id]?.question?.trim() ||
                          !editStates[card.id]?.answer?.trim()
                        }
                      >
                        <Save className="w-4 h-4" />
                      </LoadingButton>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelEditing(card.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Question */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Question
                </Label>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.question || ""}
                    onChange={(e) =>
                      updateEditState(card.id, "question", e.target.value)
                    }
                    placeholder="Enter the question..."
                    className="min-h-[80px]"
                  />
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-foreground">{card.question}</p>
                  </div>
                )}
              </div>

              {/* Answer */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Answer
                </Label>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.answer || ""}
                    onChange={(e) =>
                      updateEditState(card.id, "answer", e.target.value)
                    }
                    placeholder="Enter the answer..."
                    className="min-h-[80px]"
                  />
                ) : (
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-foreground">{card.answer}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Section */}
      {cards.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Ready to Save Your Flashcard Set?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Your {cards.length} flashcards are ready to be saved and
                  studied
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/create")}
                >
                  Cancel
                </Button>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <FileText className="w-4 h-4 mr-2" />
                      Save Flashcard Set
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Flashcard Set</DialogTitle>
                      <DialogDescription>
                        Give your flashcard set a name to save it to your
                        collection.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="set-name">Set Name</Label>
                        <Input
                          id="set-name"
                          value={setName}
                          onChange={(e) => setSetName(e.target.value)}
                          placeholder="Enter a name for your flashcard set..."
                          className="mt-1"
                        />
                      </div>

                      {analysis && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">
                            <strong>Content:</strong> {analysis.contentType} •{" "}
                            {cards.length} cards
                          </p>
                          {analysis.keyTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {analysis.keyTopics
                                .slice(0, 4)
                                .map((topic, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              {analysis.keyTopics.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{analysis.keyTopics.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {isSaving && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Saving...
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {saveProgress}%
                            </span>
                          </div>
                          <Progress value={saveProgress} className="h-2" />
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowSaveDialog(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <LoadingButton
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!setName.trim()}
                        loadingText="Saving..."
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Set
                      </LoadingButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {cards.length === 0 && !loading && !error && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Flashcards to Review
            </h3>
            <p className="text-muted-foreground mb-4">
              It looks like no flashcards were generated. Please try creating
              them again.
            </p>
            <Button onClick={() => router.push("/create")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Create
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
