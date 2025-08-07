import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CardRefinement } from "./CardRefinement";
import { Edit, Trash2, Save, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Flashcard } from "@/hooks/create/useReviewCards";

interface EditState {
  question: string;
  answer: string;
}

interface CardsListProps {
  cards: Flashcard[];
  viewMode: "preview" | "edit";
  selectedCards: Set<string>;
  editStates: Record<string, EditState>;
  isCardRegenerating: (cardId: string) => boolean;
  onToggleSelection: (cardId: string) => void;
  onStartEditing: (cardId: string) => void;
  onCancelEditing: (cardId: string) => void;
  onSaveCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateEditState: (
    cardId: string,
    field: "question" | "answer",
    value: string
  ) => void;
  onCardRefinement: (cardId: string, instruction: string) => Promise<void>;
}

export function CardsList({
  cards,
  viewMode,
  selectedCards,
  editStates,
  isCardRegenerating,
  onToggleSelection,
  onStartEditing,
  onCancelEditing,
  onSaveCard,
  onDeleteCard,
  onUpdateEditState,
  onCardRefinement,
}: CardsListProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No flashcards to review.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-8">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={`bg-card border-border transition-all duration-200 ${
              card.isNew ? "border-primary shadow-lg" : ""
            } ${
              selectedCards.has(card.id)
                ? "ring-2 ring-primary bg-primary/5"
                : ""
            } ${
              isCardRegenerating(card.id)
                ? "opacity-75 pointer-events-none"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {viewMode === "edit" && (
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={() => onToggleSelection(card.id)}
                      className="rounded border-border"
                      disabled={isCardRegenerating(card.id)}
                    />
                  )}
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
                  {/* Card Refinement Component */}
                  <CardRefinement
                    cardId={card.id}
                    isRegenerating={isCardRegenerating(card.id)}
                    onRegenerate={(instruction) =>
                      onCardRefinement(card.id, instruction)
                    }
                  />

                  {/* Edit/Save Controls */}
                  {card.isEditing ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSaveCard(card.id)}
                            disabled={
                              !editStates[card.id]?.question.trim() ||
                              !editStates[card.id]?.answer.trim() ||
                              isCardRegenerating(card.id)
                            }
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save changes</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelEditing(card.id)}
                            disabled={isCardRegenerating(card.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cancel editing</TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStartEditing(card.id)}
                            disabled={isCardRegenerating(card.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit card</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteCard(card.id)}
                            disabled={isCardRegenerating(card.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete card</TooltipContent>
                      </Tooltip>
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
                      onUpdateEditState(card.id, "question", e.target.value)
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
                      onUpdateEditState(card.id, "answer", e.target.value)
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

              {/* Refinement Status */}
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
    </TooltipProvider>
  );
}
