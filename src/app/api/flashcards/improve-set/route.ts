import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ImproveSetRequest {
  cards: Array<{
    id?: string; // Optional ID to match cards back
    question: string;
    answer: string;
  }>;
  improvement:
    | "make_harder"
    | "make_easier"
    | "add_examples"
    | "add_context"
    | "diversify_questions"
    | "improve_clarity"
    | "add_more_cards"
    | "fix_grammar";
  customInstruction?: string; // Optional custom improvement instruction
  context?: string; // Optional: original text content
  contentType?: "vocabulary" | "concepts" | "mixed" | "other";
  targetCardCount?: number; // For "add_more_cards" improvement
}

interface ImprovedCard {
  id?: string; // Match back to original if provided
  question: string;
  answer: string;
  isNew?: boolean; // For added cards
}

function createSetImprovementPrompt(
  cards: ImproveSetRequest["cards"],
  improvement: string,
  customInstruction?: string,
  context?: string,
  contentType?: string,
  targetCardCount?: number
): string {
  const improvementDescriptions = {
    make_harder:
      "Increase difficulty by adding complexity, nuance, or requiring deeper analysis",
    make_easier:
      "Simplify language and concepts while maintaining educational value",
    add_examples:
      "Include concrete examples, scenarios, or practical applications",
    add_context: "Provide more background information and contextual details",
    diversify_questions:
      "Create more varied question types and formats to avoid repetition",
    improve_clarity: "Enhance wording and structure for better understanding",
    add_more_cards: `Add ${
      targetCardCount ? targetCardCount - cards.length : "additional"
    } cards to improve coverage`,
    fix_grammar: "Correct grammatical errors and improve language quality",
  };

  let prompt = `You are an expert at improving educational flashcard sets. Improve the following flashcard set based on the specific instruction.

IMPROVEMENT TYPE: ${improvement}
DESCRIPTION: ${
    improvementDescriptions[
      improvement as keyof typeof improvementDescriptions
    ] || improvement
  }

${contentType ? `CONTENT TYPE: ${contentType}` : ""}

CURRENT FLASHCARD SET (${cards.length} cards):
${cards
  .map(
    (card, index) => `${index + 1}. Q: ${card.question}\n   A: ${card.answer}`
  )
  .join("\n\n")}

${
  context
    ? `ORIGINAL CONTEXT (for reference):
${context.substring(0, 800)}${context.length > 800 ? "..." : ""}`
    : ""
}

${customInstruction ? `CUSTOM INSTRUCTION: ${customInstruction}` : ""}

IMPROVEMENT GUIDELINES:`;

  if (improvement === "add_more_cards") {
    const additionalCards = targetCardCount
      ? targetCardCount - cards.length
      : 3;
    prompt += `\n- Return ALL existing cards (improved if needed) PLUS ${additionalCards} new cards
- New cards should cover gaps or provide additional practice
- Mark new cards with "isNew": true in the response
- Total cards should be ${targetCardCount || cards.length + additionalCards}`;
  } else {
    prompt += `\n- Improve ALL cards in the set according to the instruction
- Maintain the same number of cards (${cards.length})
- Keep the educational content accurate and valuable
- Apply the improvement consistently across all cards`;
  }

  prompt += `\n- Preserve any provided card IDs for matching back to originals
- Ensure questions remain clear and answers remain accurate
- Don't change the fundamental concepts being taught

SPECIFIC IMPROVEMENT INSTRUCTIONS:`;

  switch (improvement) {
    case "make_harder":
      prompt += `\n- Add complexity to questions (multi-step reasoning, analysis)
- Include edge cases or exceptions
- Require deeper understanding rather than simple recall
- Add "why" or "how" elements to questions`;
      break;
    case "make_easier":
      prompt += `\n- Simplify vocabulary and sentence structure
- Break complex concepts into simpler parts
- Use clearer, more direct language
- Focus on fundamental understanding`;
      break;
    case "add_examples":
      prompt += `\n- Include concrete examples in questions or answers
- Add real-world applications or scenarios
- Provide context that helps understanding
- Use specific cases to illustrate concepts`;
      break;
    case "add_context":
      prompt += `\n- Provide background information where helpful
- Explain relationships to other concepts
- Add historical or practical context
- Help users understand the broader picture`;
      break;
    case "diversify_questions":
      prompt += `\n- Use different question formats (fill-in-blank, multiple choice style, scenarios)
- Vary the cognitive load (recall, understanding, application)
- Avoid repetitive question patterns
- Create questions that test the same concept differently`;
      break;
    case "improve_clarity":
      prompt += `\n- Make questions more specific and unambiguous
- Improve answer completeness and accuracy
- Fix confusing wording or unclear instructions
- Ensure questions have only one correct interpretation`;
      break;
    case "fix_grammar":
      prompt += `\n- Correct grammatical errors and typos
- Improve sentence structure and flow
- Fix punctuation and capitalization
- Ensure professional language quality`;
      break;
  }

  prompt += `\n\nReturn a JSON array of objects with these fields:
- "question": improved question text
- "answer": improved answer text
- "id": original card ID if provided
- "isNew": true only for newly added cards

Generate the improved flashcard set now:`;

  return prompt;
}

function validateImprovedCards(cards: unknown): cards is ImprovedCard[] {
  if (!Array.isArray(cards)) {
    return false;
  }

  return cards.every((card) => {
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
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: ImproveSetRequest = await request.json();
    const {
      cards,
      improvement,
      customInstruction,
      context,
      contentType,
      targetCardCount,
    } = body;

    // Validation
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "Cards array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!improvement || typeof improvement !== "string") {
      return NextResponse.json(
        { error: "Improvement type is required" },
        { status: 400 }
      );
    }

    // Validate individual cards
    const invalidCard = cards.find(
      (card) =>
        !card.question ||
        !card.answer ||
        typeof card.question !== "string" ||
        typeof card.answer !== "string"
    );

    if (invalidCard) {
      return NextResponse.json(
        { error: "All cards must have valid question and answer strings" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = createSetImprovementPrompt(
      cards,
      improvement,
      customInstruction,
      context,
      contentType,
      targetCardCount
    );

    console.log("Improving flashcard set:", {
      cardCount: cards.length,
      improvement,
      contentType: contentType || "unknown",
      hasCustomInstruction: !!customInstruction,
      hasContext: !!context,
      targetCardCount: targetCardCount || "not specified",
    });

    // Call OpenAI for set improvement
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator focused on improving flashcard sets. Always return valid JSON arrays with the requested structure.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Some creativity for improvements
      max_tokens: 4000, // Higher limit for multiple cards
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the improved cards
    let improvedCards: ImprovedCard[];
    try {
      // Clean the response in case there's markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedResponse);

      if (validateImprovedCards(parsed)) {
        improvedCards = parsed;
      } else {
        throw new Error("Response is not in expected format");
      }
    } catch (parseError) {
      console.error("Failed to parse improvement response:", response);
      console.error("Parse error:", parseError);

      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (validateImprovedCards(parsed)) {
            improvedCards = parsed;
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

    // Clean up the improved cards
    const finalCards: ImprovedCard[] = improvedCards.map((card) => ({
      id: card.id,
      question: card.question.trim(),
      answer: card.answer.trim(),
      isNew: card.isNew || false,
    }));

    // Validation based on improvement type
    if (improvement === "add_more_cards") {
      const expectedCount = targetCardCount || cards.length + 3;
      if (finalCards.length < expectedCount) {
        console.warn(
          `Expected ${expectedCount} cards but got ${finalCards.length}`
        );
      }
    } else {
      if (finalCards.length !== cards.length) {
        console.warn(
          `Expected ${cards.length} cards but got ${finalCards.length} for improvement: ${improvement}`
        );
      }
    }

    const newCardsCount = finalCards.filter((card) => card.isNew).length;

    console.log("Successfully improved flashcard set:", {
      originalCount: cards.length,
      finalCount: finalCards.length,
      newCardsAdded: newCardsCount,
    });

    return NextResponse.json({
      cards: finalCards,
      metadata: {
        improvement,
        originalCount: cards.length,
        finalCount: finalCards.length,
        newCardsAdded: newCardsCount,
        contentType: contentType || "unknown",
        hasCustomInstruction: !!customInstruction,
      },
    });
  } catch (error) {
    console.error("Error improving flashcard set:", error);

    let errorMessage = "Failed to improve flashcard set";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "OpenAI API configuration error";
      } else if (error.message.includes("parse")) {
        errorMessage = "AI response format error - please try again";
        statusCode = 502;
      } else if (error.message.includes("validation")) {
        errorMessage = "Generated cards format is invalid - please try again";
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
