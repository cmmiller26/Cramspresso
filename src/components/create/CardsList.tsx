// src/components/create/CardsList.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
}

export function CardsList({
  cards,
  viewMode,
  selectedCards,
  editStates,
  onToggleSelection,
  onStartEditing,
  onCancelEditing,
  onSaveCard,
  onDeleteCard,
  onUpdateEditState,
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
            className={`bg-card border-border ${
              card.isNew ? "border-primary" : ""
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
                    />
                  )}
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Card {index + 1}
                    {card.isNew && (
                      <Badge variant="secondary" className="ml-2">
                        New
                      </Badge>
                    )}
                  </CardTitle>
                </div>

                <div className="flex gap-2">
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
                              !editStates[card.id]?.answer.trim()
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
                <h4 className="font-medium text-foreground mb-2">Question:</h4>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.question || ""}
                    onChange={(e) =>
                      onUpdateEditState(card.id, "question", e.target.value)
                    }
                    placeholder="Enter the question..."
                    className="min-h-[80px] resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {card.question}
                  </p>
                )}
              </div>

              {/* Answer */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Answer:</h4>
                {card.isEditing ? (
                  <Textarea
                    value={editStates[card.id]?.answer || ""}
                    onChange={(e) =>
                      onUpdateEditState(card.id, "answer", e.target.value)
                    }
                    placeholder="Enter the answer..."
                    className="min-h-[80px] resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {card.answer}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
