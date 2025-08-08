import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { ContentAnalysis, GenerationRequest } from "@/lib/types/create";
import type { CreateFlashcard } from "@/lib/types/flashcards";

function validateFlashcard(card: unknown): card is CreateFlashcard {
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

function createContentAdaptivePrompt(
  text: string,
  analysis?: ContentAnalysis,
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

  console.log(`🧠 Content-adaptive generation started:`, {
    contentType,
    vocabularyTermsFound: vocabularyTerms.length,
    keyTopicsFound: keyTopics.length,
    focusAreas: suggestedFocus,
    approach: analysis?.contentGuidance?.approach || "balanced",
    wordCount,
  });

  let approach = "";
  let generationStrategy = "";

  if (contentType === "vocabulary" && vocabularyTerms.length > 0) {
    approach = `This is vocabulary content with ${vocabularyTerms.length} terms. Create one comprehensive flashcard for each vocabulary term to ensure complete coverage.`;
    generationStrategy = `- Create one card per vocabulary term (aiming for ${vocabularyTerms.length} cards)
   - Prioritize term definitions and usage
   - Include context and examples where helpful
   - Create synonym/antonym questions if applicable`;
  } else if (contentType === "concepts") {
    approach = `This is conceptual content. Create enough flashcards to thoroughly cover each key concept and their relationships. Focus on quality and comprehensive understanding.`;
    generationStrategy = `- Focus on explanations and applications
   - Create comparison questions between concepts
   - Include cause-and-effect relationships
   - Ensure each major concept is well covered`;
  } else if (contentType === "mixed") {
    approach = `This is mixed content containing both vocabulary and concepts. Create an optimal number of flashcards that balances vocabulary terms and conceptual understanding.`;
    generationStrategy = `- Balance vocabulary and conceptual questions
   - Connect terms to broader concepts
   - Vary question difficulty and type
   - Ensure comprehensive coverage of both aspects`;
  } else {
    approach = `Analyze this content and create the optimal number of flashcards to cover the material comprehensively.`;
    generationStrategy = `- Identify key concepts and terms
   - Create questions that test understanding
   - Vary question difficulty and type`;
  }

  let prompt = `You are an expert at creating educational flashcards. ${approach}

CONTENT ANALYSIS:
- Content Type: ${contentType}
- Word Count: ${wordCount}
- Key Topics: ${keyTopics.join(", ") || "Not specified"}
- Vocabulary Terms Found: ${vocabularyTerms.length}
- Focus Areas: ${suggestedFocus.join(", ")}

GENERATION INSTRUCTIONS:
IMPORTANT: Do not aim for a specific number of cards. Focus on:
1. Complete coverage of the material
2. Quality over quantity  
3. Appropriate depth for the content type

Content-specific approach:
${generationStrategy}`;

  if (vocabularyTerms.length > 0) {
    prompt += `

VOCABULARY TERMS TO COVER:
${vocabularyTerms
  .slice(0, 15)
  .map(
    (term) => `- ${term.term}${term.definition ? ": " + term.definition : ""}`
  )
  .join("\n")}${
      vocabularyTerms.length > 15
        ? `\n... and ${vocabularyTerms.length - 15} more terms`
        : ""
    }`;
  }

  if (keyTopics.length > 0) {
    prompt += `

KEY TOPICS TO COVER:
${keyTopics.map((topic) => `- ${topic}`).join("\n")}`;
  }

  prompt += `

QUALITY GUIDELINES:
- Make questions clear and concise
- Provide complete, accurate answers
- Vary question difficulty to promote deeper learning
- Avoid redundant or overly similar questions
- Focus on understanding, not memorization

FORMAT: Return a JSON array of objects with "question" and "answer" fields only.

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ""}

CONTENT TO CREATE FLASHCARDS FROM:
${text}

Create the optimal number of high-quality flashcards for comprehensive coverage:`;

  return prompt;
}

export async function POST(request: NextRequest) {
  console.log("🔄 POST /api/flashcards/generate - Request started");

  try {
    const body: GenerationRequest = await request.json();
    const { text, analysis, focusAreas, customInstructions } = body;

    console.log("📋 Request body parsed:", {
      textLength: text?.length || 0,
      hasAnalysis: !!analysis,
      analysisType: analysis?.contentType,
      contentGuidance: analysis?.contentGuidance?.approach || "balanced",
      vocabularyTermsCount: analysis?.vocabularyTerms?.length || 0,
      keyTopicsCount: analysis?.keyTopics?.length || 0,
      focusAreasCount: focusAreas?.length || 0,
      hasCustomInstructions: !!customInstructions,
    });

    // Validation
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      console.error("❌ Validation failed: Invalid text content");
      return NextResponse.json(
        {
          error:
            "Text content is required and must be at least 10 characters long",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create content-adaptive prompt
    const systemPrompt = createContentAdaptivePrompt(
      text,
      analysis,
      focusAreas,
      customInstructions
    );

    console.log("🤖 Prepared OpenAI request:", {
      model: "gpt-4o-mini",
      promptLength: systemPrompt.length,
      temperature: 0.7,
      maxTokens: 3000,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // More reliable than gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator who excels at making high-quality flashcards. Always return valid JSON arrays with question and answer fields. Focus on comprehensive coverage and quality over hitting specific numbers.",
        },
        {
          role: "user",
          content: systemPrompt,
        },
      ],
      temperature: 0.7, // Some creativity but stay focused
      max_tokens: 3000, // Increased for more cards
    });

    console.log("📡 OpenAI API response received:", {
      finishReason: completion.choices[0]?.finish_reason,
      usage: completion.usage,
      hasContent: !!completion.choices[0]?.message?.content,
      contentLength: completion.choices[0]?.message?.content?.length || 0,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error("❌ No response from OpenAI");
      throw new Error("No response from OpenAI");
    }

    console.log("📄 Raw OpenAI response preview:", {
      firstChars: response.substring(0, 200) + "...",
      lastChars: "..." + response.substring(response.length - 200),
      containsJSON: response.includes("[") && response.includes("]"),
      containsMarkdown: response.includes("```"),
    });

    // Parse and validate the JSON response
    let flashcards: CreateFlashcard[];
    try {
      // Clean the response in case there's markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      console.log("🧹 Cleaned response preview:", {
        firstChars: cleanedResponse.substring(0, 100) + "...",
        isCleanedDifferent: cleanedResponse !== response,
      });

      const parsed = JSON.parse(cleanedResponse);
      console.log("✅ JSON parsed successfully:", {
        isArray: Array.isArray(parsed),
        hasFlashcardsField:
          parsed && typeof parsed === "object" && "flashcards" in parsed,
        topLevelKeys:
          parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
        arrayLength: Array.isArray(parsed) ? parsed.length : null,
        flashcardsArrayLength:
          parsed && Array.isArray(parsed.flashcards)
            ? parsed.flashcards.length
            : null,
      });

      if (Array.isArray(parsed)) {
        flashcards = parsed;
      } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        flashcards = parsed.flashcards;
      } else {
        console.error("❌ Response format not recognized:", {
          parsedType: typeof parsed,
          parsedKeys:
            parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
          parsedStructure: parsed,
        });
        throw new Error("Response is not in expected format");
      }
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response:", {
        parseError:
          parseError instanceof Error ? parseError.message : parseError,
        rawResponse: response.substring(0, 500) + "...",
      });

      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          flashcards = JSON.parse(jsonMatch[0]);
          console.log("✅ Fallback JSON extraction successful:", {
            extractedLength: flashcards.length,
          });
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("AI response does not contain valid JSON");
      }
    }

    console.log("🔍 Validating flashcards:", {
      totalCards: flashcards.length,
      cardTypes: flashcards
        .map((card, index) => ({
          index,
          isObject: typeof card === "object",
          hasQuestion: card && typeof card.question === "string",
          hasAnswer: card && typeof card.answer === "string",
          questionLength:
            card && typeof card.question === "string"
              ? card.question.length
              : 0,
          answerLength:
            card && typeof card.answer === "string" ? card.answer.length : 0,
        }))
        .slice(0, 3), // Show first 3 for debugging
    });

    // Validate and filter flashcards
    const validFlashcards = flashcards.reduce<CreateFlashcard[]>(
      (acc, card, index) => {
        if (validateFlashcard(card)) {
          const validCard = card as CreateFlashcard;
          const trimmedQuestion = validCard.question.trim();
          const trimmedAnswer = validCard.answer.trim();
          if (trimmedQuestion.length > 0 && trimmedAnswer.length > 0) {
            acc.push({ question: trimmedQuestion, answer: trimmedAnswer });
          }
        } else {
          const cardObj = card as Record<string, unknown>;
          console.warn(`⚠️ Invalid card at index ${index}:`, {
            card,
            type: typeof card,
            hasQuestion:
              card &&
              typeof card === "object" &&
              "question" in card &&
              typeof cardObj.question === "string",
            hasAnswer:
              card &&
              typeof card === "object" &&
              "answer" in card &&
              typeof cardObj.answer === "string",
          });
        }
        return acc;
      },
      []
    );

    console.log("✅ Card validation completed:", {
      originalCount: flashcards.length,
      validCount: validFlashcards.length,
      invalidCount: flashcards.length - validFlashcards.length,
    });

    if (validFlashcards.length === 0) {
      console.error("❌ No valid flashcards generated");
      throw new Error("No valid flashcards were generated from the content");
    }

    // Log generation results
    console.log(`✅ Generated flashcards based on content:`, {
      contentType: analysis?.contentType || "unknown",
      vocabularyTermsFound: analysis?.vocabularyTerms?.length || 0,
      keyTopicsFound: analysis?.keyTopics?.length || 0,
      cardsGenerated: validFlashcards.length,
    });

    // Don't limit the cards here - let AI decide the right amount
    const finalFlashcards = validFlashcards;

    const responseData = {
      cards: finalFlashcards,
      metadata: {
        contentType: analysis?.contentType || "unknown",
        generationApproach: analysis?.contentGuidance?.approach || "balanced",
        actualCount: finalFlashcards.length,
        contentLength: text.length,
        wordCount: text.split(/\s+/).length,
        vocabularyTermsFound: analysis?.vocabularyTerms?.length || 0,
        keyTopicsFound: analysis?.keyTopics?.length || 0,
        focusAreas: focusAreas || analysis?.suggestedFocus || [],
        keyTopics: analysis?.keyTopics || [],
        vocabularyTerms: analysis?.vocabularyTerms || [],
      },
    };

    console.log("🎉 Generation completed successfully:", {
      flashcardsCount: finalFlashcards.length,
      contentType: analysis?.contentType || "unknown",
      approach: analysis?.contentGuidance?.approach || "balanced",
      vocabularyTermsCovered: analysis?.vocabularyTerms?.length || 0,
      keyTopicsCovered: analysis?.keyTopics?.length || 0,
      responseKeys: Object.keys(responseData),
      metadataKeys: Object.keys(responseData.metadata),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error generating flashcards:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

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
