import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface GenerationRequest {
  text: string;
  analysis?: {
    contentType: "vocabulary" | "concepts" | "mixed" | "other";
    keyTopics: string[];
    vocabularyTerms: Array<{ term: string; definition?: string }>;
    suggestedFocus: string[];
  };
  cardCount?: number; // Optional, will use analysis estimate if not provided
  focusAreas?: string[]; // User can override suggested focus
  customInstructions?: string; // Optional additional instructions
}

interface Flashcard {
  question: string;
  answer: string;
}

function validateFlashcard(card: unknown): card is Flashcard {
  if (typeof card !== "object" || card === null) {
    return false;
  }

  const cardObj = card as Record<string, unknown>;

  return (
    typeof cardObj.question === "string" &&
    typeof cardObj.answer === "string" &&
    cardObj.question.trim().length > 0 &&
    cardObj.answer.trim().length > 0
  );
}

function createSmartPrompt(
  text: string,
  analysis?: GenerationRequest["analysis"],
  cardCount?: number,
  focusAreas?: string[],
  customInstructions?: string
): string {
  const wordCount = text.split(/\s+/).length;

  // Use analysis if provided, otherwise do basic detection
  const contentType = analysis?.contentType || "other";
  const keyTopics = analysis?.keyTopics || [];
  const vocabularyTerms = analysis?.vocabularyTerms || [];
  const suggestedFocus = focusAreas ||
    analysis?.suggestedFocus || ["definitions", "explanations"];

  // Calculate target cards
  const targetCards =
    cardCount || Math.max(5, Math.min(25, Math.floor(wordCount / 50)));

  let prompt = `You are an expert at creating educational flashcards. Create exactly ${targetCards} high-quality flashcards from the analyzed content below.

CONTENT ANALYSIS:
- Content Type: ${contentType}
- Word Count: ${wordCount}
- Key Topics: ${keyTopics.join(", ") || "Not specified"}
- Vocabulary Terms Found: ${vocabularyTerms.length}
- Focus Areas: ${suggestedFocus.join(", ")}

GENERATION INSTRUCTIONS:
1. Create ${targetCards} diverse, educational flashcards
2. Focus on: ${suggestedFocus.join(", ")}
3. Content type considerations:`;

  if (contentType === "vocabulary") {
    prompt += `
   - Prioritize term definitions and usage
   - Include context and examples where helpful
   - Create synonym/antonym questions if applicable`;
  } else if (contentType === "concepts") {
    prompt += `
   - Focus on explanations and applications
   - Create comparison questions between concepts
   - Include cause-and-effect relationships`;
  } else if (contentType === "mixed") {
    prompt += `
   - Balance vocabulary and conceptual questions
   - Connect terms to broader concepts
   - Vary question difficulty and type`;
  }

  if (vocabularyTerms.length > 0) {
    prompt += `

VOCABULARY TERMS DETECTED:
${vocabularyTerms
  .slice(0, 10)
  .map(
    (term) => `- ${term.term}${term.definition ? ": " + term.definition : ""}`
  )
  .join("\n")}${
      vocabularyTerms.length > 10
        ? `\n... and ${vocabularyTerms.length - 10} more terms`
        : ""
    }`;
  }

  if (keyTopics.length > 0) {
    prompt += `

KEY TOPICS TO COVER:
${keyTopics.map((topic) => `- ${topic}`).join("\n")}`;
  }

  prompt += `

4. Make questions clear and concise
5. Provide complete, accurate answers
6. Vary question difficulty to promote deeper learning
7. Avoid redundant or overly similar questions

FORMAT: Return a JSON array of objects with "question" and "answer" fields only.

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ""}

CONTENT TO CREATE FLASHCARDS FROM:
${text}

Generate exactly ${targetCards} flashcards now:`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { text, analysis, cardCount, focusAreas, customInstructions } = body;

    // Validation
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Text content is required and must be at least 10 characters long",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create smart prompt
    const systemPrompt = createSmartPrompt(
      text,
      analysis,
      cardCount,
      focusAreas,
      customInstructions
    );

    console.log("Generating flashcards:", {
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      contentType: analysis?.contentType || "unknown",
      requestedCards: cardCount || "auto",
      focusAreas: focusAreas || analysis?.suggestedFocus || [],
      hasCustomInstructions: !!customInstructions,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // More reliable than gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator who excels at making high-quality flashcards. Always return valid JSON arrays with question and answer fields.",
        },
        {
          role: "user",
          content: systemPrompt,
        },
      ],
      temperature: 0.7, // Some creativity but stay focused
      max_tokens: 3000, // Increased for more cards
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse and validate the JSON response
    let flashcards: Flashcard[];
    try {
      // Clean the response in case there's markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedResponse);

      if (Array.isArray(parsed)) {
        flashcards = parsed;
      } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        flashcards = parsed.flashcards;
      } else {
        throw new Error("Response is not in expected format");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", response);
      console.error("Parse error:", parseError);

      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          flashcards = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("AI response does not contain valid JSON");
      }
    }

    // Validate and filter flashcards
    const validFlashcards = flashcards
      .filter(validateFlashcard)
      .map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
      }))
      .filter((card) => card.question.length > 0 && card.answer.length > 0);

    if (validFlashcards.length === 0) {
      throw new Error("No valid flashcards were generated from the content");
    }

    // Don't limit the cards here - let AI decide the right amount
    const finalFlashcards = validFlashcards;

    console.log(`Successfully generated ${finalFlashcards.length} flashcards`);

    return NextResponse.json({
      flashcards: finalFlashcards,
      metadata: {
        contentType: analysis?.contentType || "unknown",
        requestedCount: cardCount || "auto",
        actualCount: finalFlashcards.length,
        contentLength: text.length,
        wordCount: text.split(/\s+/).length,
        focusAreas: focusAreas || analysis?.suggestedFocus || [],
      },
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);

    // Provide more helpful error messages
    let errorMessage = "Failed to generate flashcards";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "OpenAI API configuration error";
        statusCode = 500;
      } else if (error.message.includes("parse")) {
        errorMessage = "AI response format error - please try again";
        statusCode = 502;
      } else if (error.message.includes("No valid flashcards")) {
        errorMessage =
          "Could not generate flashcards from this content. Try providing more detailed text.";
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
