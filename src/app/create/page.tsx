"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewSetForm } from "@/components/dashboard/NewSetForm";
import { UploadZone } from "@/components/UploadZone";
import { generateFromUrls } from "@/lib/flashcardApi";
import { Flashcard } from "@/lib/flashcards";

export default function CreatePage() {
  const [stage, setStage] = useState<"upload" | "preview">("upload");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const router = useRouter();

  async function onUploadComplete(files: { ufsUrl: string }[]) {
    const urls = files.map((f) => f.ufsUrl);
    const generated = await generateFromUrls(urls);
    if (generated.length === 0)
      return alert("No flashcards generated. Please try again.");
    setCards(generated);
    setStage("preview");
  }

  function renderStage() {
    switch (stage) {
      case "upload":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Create New Flashcard Set
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload your documents to generate flashcards
              </p>
            </div>
            <UploadZone onClientUploadComplete={onUploadComplete} />
          </div>
        );
      case "preview":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Review Generated Cards
              </h1>
              <p className="text-lg text-muted-foreground">
                Review your flashcards and save them as a set
              </p>
            </div>
            <ul className="space-y-4 max-h-64 overflow-auto">
              {cards.map((c, i) => (
                <li
                  key={i}
                  className="border border-border p-3 rounded bg-card"
                >
                  <p className="font-semibold text-foreground">{c.question}</p>
                  <p className="text-muted-foreground">{c.answer}</p>
                </li>
              ))}
            </ul>
            <NewSetForm
              cards={cards}
              onCreate={(id) => router.push(`/sets/${id}`)}
            />
          </div>
        );
    }
  }

  return (
    <>
      <title>Create Flashcard Set - Cramspresso</title>
      <main className="p-8 mx-auto max-w-2xl space-y-6">{renderStage()}</main>
    </>
  );
}
