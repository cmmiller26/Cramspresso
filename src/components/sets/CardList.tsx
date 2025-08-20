"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Flashcard } from "@/lib/types/flashcards";
import { Search } from "lucide-react";

interface Props {
  cards: Flashcard[];
  variant?: "overview" | "editor";
  loading?: boolean;
}

export function CardList({
  cards,
  variant = "overview",
  loading = false,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCards = cards.filter(
    (card) =>
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="max-w-sm mx-auto">
          <p className="text-lg font-medium mb-2">No cards in this set yet.</p>
          {variant === "overview" && (
            <p className="text-sm">Click &quot;Edit&quot; to add some cards!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {cards.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No cards match your search.</p>
          </div>
        ) : (
          filteredCards.map((card, index) => (
            <Card
              key={card.id ?? `card-${index}`}
              className="border-border hover:bg-muted/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        Q
                      </span>
                      <p className="text-foreground flex-1">{card.question}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        A
                      </span>
                      <p className="text-foreground flex-1">{card.answer}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results count */}
      {searchTerm && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredCards.length} of {cards.length} cards
        </p>
      )}
    </div>
  );
}
