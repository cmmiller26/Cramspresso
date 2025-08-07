import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface AnalysisRequest {
  text: string;
}

interface ContentAnalysis {
  contentType: "vocabulary" | "concepts" | "mixed" | "other";
  confidence: number;
  summary: string;
  keyTopics: string[];
  vocabularyTerms: Array<{ term: string; definition?: string }>;
  contentGuidance: {
    approach: "one-per-term" | "concept-coverage" | "balanced";
    rationale: string;
    expectedRange: string; // e.g., "8-12 cards" or "1 card per term"
  };
  suggestedFocus: string[];
  reasoning: string;
}

function createAnalysisPrompt(text: string): string {
  const wordCount = text.split(/\s+/).length;

  return `You are an expert educational content analyzer. Analyze the following text and provide a structured analysis for flashcard creation.

TEXT TO ANALYZE (${wordCount} words):
${text}

Return a JSON object with this exact structure:
{
  "contentType": "vocabulary" | "concepts" | "mixed" | "other",
  "confidence": 0.0-1.0,
  "summary": "Brief description of what this content contains",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "vocabularyTerms": [{"term": "word", "definition": "meaning if found"}],
  "contentGuidance": {
    "approach": "one-per-term" | "concept-coverage" | "balanced",
    "rationale": "Explain the recommended generation approach",
    "expectedRange": "Expected number or range of cards (e.g., '1 card per term' or '8-12 cards')"
  },
  "suggestedFocus": ["definitions", "applications", "comparisons", etc.],
  "reasoning": "Explain why you classified it this way and what makes good flashcards from this content"
}

ANALYSIS GUIDELINES:
- "vocabulary": Primarily word definitions, terms, translations
- "concepts": Ideas, processes, explanations, theories
- "mixed": Both vocabulary and conceptual content
- "other": Lists, facts, data that don't fit above categories

CONTENT GUIDANCE APPROACHES:
- "one-per-term": For vocabulary lists - create one card per vocabulary term
- "concept-coverage": For conceptual content - ensure comprehensive coverage of concepts
- "balanced": For mixed content - balance vocabulary and conceptual cards

- keyTopics: 3-5 main subjects/themes in the content
- vocabularyTerms: Extract clear term-definition pairs if they exist
- contentGuidance: Recommend generation approach and provide expected range
- suggestedFocus: What types of questions would work best
- confidence: How sure you are about the content type (higher = more obvious)
- reasoning: Help the user understand your analysis

Be thorough but concise. Focus on what would make effective flashcards.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { text } = body;

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

    const prompt = createAnalysisPrompt(text);

    console.log("Analyzing content:", {
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
    });

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content analyzer. Always return valid JSON objects with the exact structure requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    // Parse the analysis
    let analysis: ContentAnalysis;
    try {
      // Clean the response in case there's markdown formatting
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse analysis response:", response);
      console.error("Parse error:", parseError);

      // Fallback: try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Failed to parse AI analysis as JSON");
        }
      } else {
        throw new Error("AI response does not contain valid JSON");
      }
    }

    // Validate the analysis structure
    const requiredFields = [
      "contentType",
      "confidence",
      "summary",
      "keyTopics",
      "vocabularyTerms",
      "contentGuidance",
      "suggestedFocus",
      "reasoning",
    ];
    const missingFields = requiredFields.filter(
      (field) => !(field in analysis)
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Analysis missing required fields: ${missingFields.join(", ")}`
      );
    }

    // Sanitize and validate values
    const sanitizedAnalysis: ContentAnalysis = {
      contentType: ["vocabulary", "concepts", "mixed", "other"].includes(
        analysis.contentType
      )
        ? (analysis.contentType as ContentAnalysis["contentType"])
        : "other",
      confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0.5)),
      summary: String(
        analysis.summary || "Content analysis completed"
      ).substring(0, 200),
      keyTopics: Array.isArray(analysis.keyTopics)
        ? analysis.keyTopics
            .slice(0, 8)
            .map((topic) => String(topic).substring(0, 50))
        : [],
      vocabularyTerms: Array.isArray(analysis.vocabularyTerms)
        ? analysis.vocabularyTerms.slice(0, 50).map((term) => ({
            term: String(term.term || "").substring(0, 100),
            definition: term.definition
              ? String(term.definition).substring(0, 300)
              : undefined,
          }))
        : [],
      contentGuidance: {
        approach: ["one-per-term", "concept-coverage", "balanced"].includes(
          analysis.contentGuidance?.approach
        )
          ? (analysis.contentGuidance.approach as ContentAnalysis["contentGuidance"]["approach"])
          : "balanced",
        rationale: String(
          analysis.contentGuidance?.rationale || "Balanced approach recommended"
        ).substring(0, 300),
        expectedRange: String(
          analysis.contentGuidance?.expectedRange || "5-15 cards"
        ).substring(0, 50),
      },
      suggestedFocus: Array.isArray(analysis.suggestedFocus)
        ? analysis.suggestedFocus
            .slice(0, 6)
            .map((focus) => String(focus).substring(0, 50))
        : [],
      reasoning: String(analysis.reasoning || "Analysis completed").substring(
        0,
        500
      ),
    };

    console.log(`Content analysis completed:`, {
      contentType: sanitizedAnalysis.contentType,
      confidence: sanitizedAnalysis.confidence,
      approach: sanitizedAnalysis.contentGuidance.approach,
      expectedRange: sanitizedAnalysis.contentGuidance.expectedRange,
      vocabularyTermsFound: sanitizedAnalysis.vocabularyTerms.length,
    });

    return NextResponse.json({
      analysis: sanitizedAnalysis,
      metadata: {
        originalTextLength: text.length,
        wordCount: text.split(/\s+/).length,
        processingTime: Date.now(), // Can be used for caching/debugging
      },
    });
  } catch (error) {
    console.error("Error analyzing content:", error);

    let errorMessage = "Failed to analyze content";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        errorMessage = "OpenAI API configuration error";
      } else if (error.message.includes("parse")) {
        errorMessage = "AI analysis format error - please try again";
        statusCode = 502;
      } else if (error.message.includes("missing required fields")) {
        errorMessage = "Incomplete content analysis - please try again";
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
