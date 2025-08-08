import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type {
  CardRefinementRequest,
  CardRefinementInstruction,
} from "@/lib/types/create";
import type { Flashcard } from "@/lib/types/flashcards";

function createRegenerationPrompt(
  originalCard: Flashcard,
  instruction: CardRefinementInstruction,
  context?: string,
  contentType?: string
): string {
  const prompt = `You are an expert at improving educational flashcards. Take the original flashcard and improve it based on the specific instruction.

ORIGINAL FLASHCARD:
Question: ${originalCard.question}
Answer: ${originalCard.answer}

IMPROVEMENT INSTRUCTION: ${instruction}

${contentType ? `CONTENT TYPE: ${contentType}` : ""}

${
  context
    ? `ORIGINAL CONTEXT (for reference):
${context.substring(0, 500)}${context.length > 500 ? "..." : ""}`
    : ""
}

IMPROVEMENT GUIDELINES:
- Keep the core educational value of the original card
- Make the requested improvement without changing the fundamental concept
- Ensure question and answer remain accurate and clear
- Maintain appropriate difficulty for the content type

COMMON IMPROVEMENTS:
- "make harder" → Add complexity, nuance, or application
- "make easier" → Simplify language, break down complex concepts
- "add examples" → Include concrete examples or scenarios
- "add context" → Provide more background information
- "fix grammar" → Correct any grammatical or clarity issues
- "make clearer" → Improve wording for better understanding
- "add detail" → Expand on the answer with more information
- "focus on definition" → Emphasize the core definition
- "focus on application" → Emphasize practical use

Return a JSON object with "question" and "answer" fields containing the improved flashcard.`;

  return prompt;
}

function validateRegeneratedCard(card: unknown): card is Flashcard {
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

export async function POST(request: NextRequest) {
  try {
    const body: CardRefinementRequest = await request.json();
    const { originalCard, instruction, context, contentType } = body;

    // Validation
    if (!originalCard || !originalCard.question || !originalCard.answer) {
      return NextResponse.json(
        { error: "Original card with question and answer is required" },
        { status: 400 }
      );
    }

    if (
      !instruction ||
      typeof instruction !== "string" ||
      instruction.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Improvement instruction is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = createRegenerationPrompt(
      originalCard,
      instruction.trim() as CardRefinementInstruction,
      context,
      contentType
    );

    console.log("Regenerating card:", {
      instruction: instruction.trim(),
      contentType: contentType || "unknown",
      hasContext: !!context,
      originalQuestionLength: originalCard.question.length,
    });

    // Call OpenAI for regeneration
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator focused on improving flashcards. Always return valid JSON objects with question and answer fields.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Some creativity for improvements
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the regenerated card
    let regeneratedCard: Flashcard;
    try {
      // Clean the response in case there's markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedResponse);

      if (validateRegeneratedCard(parsed)) {
        regeneratedCard = parsed;
      } else {
        throw new Error("Response is not in expected format");
      }
    } catch (parseError) {
      console.error("Failed to parse regeneration response:", response);
      console.error("Parse error:", parseError);

      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (validateRegeneratedCard(parsed)) {
            regeneratedCard = parsed;
          } else {
            throw new Error("Fallback parsing failed validation");
          }
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("AI response does not contain valid JSON");
      }
    }

    // Clean up the regenerated card
    const finalCard: Flashcard = {
      ...regeneratedCard,
      question: regeneratedCard.question.trim(),
      answer: regeneratedCard.answer.trim(),
    };

    // Basic validation that we actually improved something
    if (
      finalCard.question === originalCard.question &&
      finalCard.answer === originalCard.answer
    ) {
      console.warn(
        "Regenerated card is identical to original - AI may not have understood instruction"
      );
    }

    console.log("Successfully regenerated card");

    return NextResponse.json({
      card: finalCard,
      metadata: {
        instruction: instruction.trim(),
        contentType: contentType || "unknown",
        originalLength:
          originalCard.question.length + originalCard.answer.length,
        newLength: finalCard.question.length + finalCard.answer.length,
        hasContext: !!context,
      },
    });
  } catch (error) {
    console.error("Error regenerating card:", error);

    let errorMessage = "Failed to regenerate flashcard";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "OpenAI API configuration error";
      } else if (error.message.includes("parse")) {
        errorMessage = "AI response format error - please try again";
        statusCode = 502;
      } else if (error.message.includes("validation")) {
        errorMessage = "Generated card format is invalid - please try again";
        statusCode = 502;
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
