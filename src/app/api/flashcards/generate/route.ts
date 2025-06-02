import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseCompletionToCards } from "@/lib/flashcards";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (typeof text !== "string" || text.trim() === "")
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: [
          "You are a flashcard-making assistant.",
          "Input: arbitrary text.",
          "Output: _only_ valid JSON, an array of objects: ",
          '[{ "question": string, "answer": string }, …].',
          "No markdown, no bullet points, no extra explanation.",
        ].join(" "),
      },
      { role: "user", content: text },
    ],
  });

  const raw = completion.choices[0].message.content ?? "";
  let cards = [];
  try {
    cards = parseCompletionToCards(raw);
  } catch (err) {
    console.error("Failed to parse flashcards:", err);
    return NextResponse.json(
      { error: "Unexpected response format from OpenAI" },
      { status: 502 }
    );
  }
  return NextResponse.json({ cards });
}
