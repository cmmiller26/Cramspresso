"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewSetForm } from "@/components/NewSetForm";
import { UploadZone } from "@/components/UploadZone";
import { generateFromUrls } from "@/lib/flashcardApi";
import { Flashcard } from "@/lib/flashcards";

export default function Home() {
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
        return <UploadZone onClientUploadComplete={onUploadComplete} />;
      case "preview":
        return (
          <>
            <ul className="space-y-4 max-h-64 overflow-auto">
              {cards.map((c, i) => (
                <li key={i} className="border p-3 rounded">
                  <p className="font-semibold">{c.question}</p>
                  <p>{c.answer}</p>
                </li>
              ))}
            </ul>
            <NewSetForm
              cards={cards}
              onCreate={(id) => router.push(`/sets/${id}`)}
            />
          </>
        );
    }
  }

  return (
    <main className="p-8 mx-auto max-w-xl space-y-6">{renderStage()}</main>
  );
}
