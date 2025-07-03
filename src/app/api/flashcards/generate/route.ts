import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { parseCompletionToCards } from "@/lib/flashcards";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // Input validation
    if (typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Invalid request body. Text must be a non-empty string." },
        { status: 400 }
      );
    }

    // Call OpenAI API with error handling
    let completion;
    try {
      completion = await openai.chat.completions.create({
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
    } catch (error: unknown) {
      console.error("OpenAI API error:", error);

      // Handle specific OpenAI API errors
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as { status: number; message?: string };

        switch (apiError.status) {
          case 429:
            return NextResponse.json(
              { error: "Rate limit exceeded. Please try again later." },
              { status: 429 }
            );
          case 401:
            return NextResponse.json(
              {
                error: "Authentication failed. Please check API configuration.",
              },
              { status: 502 }
            );
          case 403:
            return NextResponse.json(
              { error: "Access forbidden. Please check API permissions." },
              { status: 502 }
            );
          case 413:
            return NextResponse.json(
              { error: "Request too large. Please reduce the text length." },
              { status: 413 }
            );
          case 500:
          case 502:
          case 503:
            return NextResponse.json(
              {
                error:
                  "OpenAI service temporarily unavailable. Please try again later.",
              },
              { status: 502 }
            );
          default:
            return NextResponse.json(
              { error: "Failed to generate flashcards. Please try again." },
              { status: 502 }
            );
        }
      }

      // Handle network/timeout errors
      if (error && typeof error === "object" && "code" in error) {
        const networkError = error as { code: string };
        if (
          networkError.code === "ECONNREFUSED" ||
          networkError.code === "ETIMEDOUT"
        ) {
          return NextResponse.json(
            {
              error:
                "Network connection failed. Please check your internet connection.",
            },
            { status: 502 }
          );
        }
      }

      // Generic error fallback
      return NextResponse.json(
        { error: "Failed to generate flashcards. Please try again." },
        { status: 502 }
      );
    }

    // Validate OpenAI response structure
    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("Invalid OpenAI response structure:", completion);
      return NextResponse.json(
        { error: "Received invalid response from OpenAI. Please try again." },
        { status: 502 }
      );
    }

    const raw = completion.choices[0].message.content ?? "";

    // Handle empty response
    if (!raw || raw.trim() === "") {
      return NextResponse.json(
        {
          error:
            "OpenAI returned an empty response. Please try again with different text.",
        },
        { status: 502 }
      );
    }

    // Parse the response into flashcards
    let cards = [];
    try {
      cards = parseCompletionToCards(raw);
    } catch (err) {
      console.error("Failed to parse flashcards:", err);
      return NextResponse.json(
        {
          error:
            "Unable to parse the generated content into flashcards. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ cards });
  } catch (error) {
    // Handle JSON parsing errors from request body
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error:
          "Invalid request format. Please ensure you're sending valid JSON.",
      },
      { status: 400 }
    );
  }
}
