"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewSetForm } from "@/components/dashboard/NewSetForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface Flashcard {
  question: string;
  answer: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you'd get cards from:
    // 1. URL params/query
    // 2. Session storage
    // 3. API call with generation ID

    // For now, simulate some generated cards
    const mockCards: Flashcard[] = [
      {
        question: "What is the main topic covered in this document?",
        answer:
          "The document covers the key concepts and principles discussed in the uploaded material.",
      },
      {
        question: "What are the important points to remember?",
        answer:
          "The critical information includes the main definitions, examples, and practical applications mentioned in the source material.",
      },
    ];

    setCards(mockCards);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/create" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Upload
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h1 className="text-3xl font-bold text-foreground">
            Review Your Flashcards
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {cards.length} flashcards generated successfully. Review and save your
          set.
        </p>
      </div>

      {/* Generated Cards Preview */}
      <div className="space-y-6 mb-8">
        <h2 className="text-xl font-semibold text-foreground">
          Generated Cards
        </h2>

        <div className="grid gap-4">
          {cards.map((card, index) => (
            <Card key={index} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Card {index + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Question:
                  </h4>
                  <p className="text-muted-foreground">{card.question}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Answer:</h4>
                  <p className="text-muted-foreground">{card.answer}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Save Set Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Save Your Flashcard Set
          </CardTitle>
          <p className="text-muted-foreground">
            Give your flashcard set a name and save it to your dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <NewSetForm
            cards={cards}
            variant="dashboard"
            onCreate={(setId) => {
              router.push(`/sets/${setId}`); // Detail view instead of dashboard
            }}
            onCancel={() => router.push("/create")}
          />
        </CardContent>
      </Card>

      {/* Future Enhancement Note */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Coming Soon:</strong> Full editing capabilities, bulk actions,
          and enhanced card customization.
        </p>
      </div>
    </div>
  );
}
