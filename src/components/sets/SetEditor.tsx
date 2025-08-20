"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flashcard } from "@/lib/types/flashcards";
import { Edit, Trash2, Plus, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  cards: Flashcard[];
  onAddCard: (card: Omit<Flashcard, "id">) => Promise<void>;
  onUpdateCard: (
    cardId: string,
    updates: { question: string; answer: string }
  ) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  loading?: boolean;
}

export function SetEditor({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  loading = false,
}: Props) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [addingCard, setAddingCard] = useState(false);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingAnswer, setEditingAnswer] = useState("");
  const [updatingCard, setUpdatingCard] = useState(false);

  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const handleAddCard = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    setAddingCard(true);
    try {
      await onAddCard({
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      });
      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      console.error("Error adding card:", error);
      alert("Failed to add card. Please try again.");
    } finally {
      setAddingCard(false);
    }
  };

  const startEditingCard = (card: Flashcard) => {
    if (!card.id) {
      alert("Cannot edit unsaved cards.");
      return;
    }
    setEditingCardId(card.id);
    setEditingQuestion(card.question);
    setEditingAnswer(card.answer);
  };

  const handleUpdateCard = async () => {
    if (!editingCardId || !editingQuestion.trim() || !editingAnswer.trim())
      return;

    setUpdatingCard(true);
    try {
      await onUpdateCard(editingCardId, {
        question: editingQuestion.trim(),
        answer: editingAnswer.trim(),
      });
      setEditingCardId(null);
      setEditingQuestion("");
      setEditingAnswer("");
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Failed to update card. Please try again.");
    } finally {
      setUpdatingCard(false);
    }
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setEditingQuestion("");
    setEditingAnswer("");
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCardId(cardId);
    try {
      await onDeleteCard(cardId);
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card. Please try again.");
    } finally {
      setDeletingCardId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Card Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Card
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Question
            </label>
            <Textarea
              placeholder="Enter the question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={2}
              disabled={addingCard || loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Answer
            </label>
            <Textarea
              placeholder="Enter the answer..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
              disabled={addingCard || loading}
            />
          </div>
          <Button
            onClick={handleAddCard}
            disabled={
              !newQuestion.trim() || !newAnswer.trim() || addingCard || loading
            }
          >
            {addingCard ? "Adding..." : "Add Card"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Cards ({cards.length})
        </h3>

        {cards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No cards yet. Add your first card above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card, index) => (
              <Card key={card.id ?? `card-${index}`} className="border-border">
                <CardContent className="p-4">
                  {editingCardId === card.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Question
                        </label>
                        <Textarea
                          value={editingQuestion}
                          onChange={(e) => setEditingQuestion(e.target.value)}
                          rows={2}
                          disabled={updatingCard}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Answer
                        </label>
                        <Textarea
                          value={editingAnswer}
                          onChange={(e) => setEditingAnswer(e.target.value)}
                          rows={3}
                          disabled={updatingCard}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateCard}
                          disabled={
                            !editingQuestion.trim() ||
                            !editingAnswer.trim() ||
                            updatingCard
                          }
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updatingCard ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={updatingCard}
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            Q
                          </span>
                          <p className="text-foreground flex-1">
                            {card.question}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            A
                          </span>
                          <p className="text-foreground flex-1">
                            {card.answer}
                          </p>
                        </div>
                      </div>

                      {card.id && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingCard(card)}
                            disabled={loading || editingCardId !== null}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={loading || deletingCardId === card.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deletingCardId === card.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Card</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this card?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    card.id && handleDeleteCard(card.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Card
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
