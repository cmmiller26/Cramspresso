import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/generate/route";
import { openai } from "@/lib/openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

// Mock the OpenAI module
jest.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

const mockOpenAI = openai.chat.completions.create as jest.MockedFunction<
  typeof openai.chat.completions.create
>;

describe("API Route /api/flashcards/generate - Success Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Valid flashcard generation", () => {
    it("returns 200 with flashcards when given valid text input", async () => {
      const validFlashcards = [
        { question: "What is the capital of France?", answer: "Paris" },
        { question: "What is the largest planet?", answer: "Jupiter" },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(validFlashcards),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "France is a country in Europe. Its capital is Paris. Jupiter is the largest planet in our solar system.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(validFlashcards);
      expect(mockOpenAI).toHaveBeenCalledTimes(1);
      expect(mockOpenAI).toHaveBeenCalledWith({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are a flashcard-making assistant. Input: arbitrary text. Output: _only_ valid JSON, an array of objects:  [{ "question": string, "answer": string }, …]. No markdown, no bullet points, no extra explanation.',
          },
          {
            role: "user",
            content:
              "France is a country in Europe. Its capital is Paris. Jupiter is the largest planet in our solar system.",
          },
        ],
      });
    });

    it("returns 200 with single flashcard when OpenAI returns one card", async () => {
      const singleFlashcard = [
        {
          question: "What is photosynthesis?",
          answer: "The process by which plants make food using sunlight",
        },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(singleFlashcard),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "Photosynthesis is the process by which plants make food using sunlight.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(singleFlashcard);
    });

    it("returns 200 with multiple flashcards from Q: A: format", async () => {
      const qaFormat = `Q: What is the speed of light?
A: 299,792,458 meters per second

Q: Who wrote Romeo and Juliet?
A: William Shakespeare

Q: What is the chemical symbol for gold?
A: Au`;

      const expectedCards = [
        {
          question: "What is the speed of light?",
          answer: "299,792,458 meters per second",
        },
        {
          question: "Who wrote Romeo and Juliet?",
          answer: "William Shakespeare",
        },
        { question: "What is the chemical symbol for gold?", answer: "Au" },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: qaFormat,
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "Physics and literature facts for studying.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(expectedCards);
    });

    it("returns 200 with flashcards containing extra properties", async () => {
      const flashcardsWithExtra = [
        {
          question: "What is DNA?",
          answer: "Deoxyribonucleic acid",
          difficulty: "medium",
          category: "biology",
        },
        {
          question: "What is H2O?",
          answer: "Water",
          difficulty: "easy",
          category: "chemistry",
        },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(flashcardsWithExtra),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "DNA and water are important in biology and chemistry.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(flashcardsWithExtra);
    });
  });

  describe("Empty results scenarios", () => {
    it("returns 200 with empty array when OpenAI returns empty JSON array", async () => {
      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "[]",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "This text doesn't contain any factual information suitable for flashcards.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });

    it("returns 200 with empty array when text cannot be parsed into flashcards", async () => {
      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "No suitable content for flashcards found.",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({
            text: "Hello world! This is just a greeting.",
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });
  });

  describe("Large text inputs", () => {
    it("handles large text input successfully", async () => {
      const largeText =
        "The solar system consists of the Sun and the objects that orbit it. " +
        "Mercury is the closest planet to the Sun. Venus is the second planet from the Sun. " +
        "Earth is the third planet and the only known planet with life. Mars is the fourth planet. " +
        "Jupiter is the largest planet in the solar system. Saturn is known for its rings. " +
        "Uranus rotates on its side. Neptune is the farthest planet from the Sun. " +
        "The asteroid belt lies between Mars and Jupiter. Comets come from the outer solar system.";

      const expectedCards = [
        { question: "Which planet is closest to the Sun?", answer: "Mercury" },
        {
          question: "What is Jupiter known for?",
          answer: "Being the largest planet in the solar system",
        },
        {
          question: "Where is the asteroid belt located?",
          answer: "Between Mars and Jupiter",
        },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(expectedCards),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: largeText }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(expectedCards);
    });
  });

  describe("Various text formats", () => {
    it("handles text with special characters and unicode", async () => {
      const textWithSpecialChars =
        "Café is a French word meaning coffee. The symbol π (pi) represents the ratio of a circle's circumference to its diameter ≈ 3.14159.";

      const expectedCards = [
        {
          question: "What does the French word 'café' mean?",
          answer: "Coffee",
        },
        {
          question: "What does the symbol π (pi) represent?",
          answer: "The ratio of a circle's circumference to its diameter",
        },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(expectedCards),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 30, total_tokens: 50 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: textWithSpecialChars }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(expectedCards);
    });

    it("handles text with line breaks and formatting", async () => {
      const formattedText = `Chapter 1: Introduction

The water cycle is an important process.
- Evaporation: Water turns to vapor
- Condensation: Vapor turns to droplets
- Precipitation: Water falls as rain

Chapter 2: Conclusion
This process repeats continuously.`;

      const expectedCards = [
        {
          question: "What are the three main stages of the water cycle?",
          answer: "Evaporation, Condensation, and Precipitation",
        },
        {
          question: "What happens during evaporation?",
          answer: "Water turns to vapor",
        },
        {
          question: "What happens during condensation?",
          answer: "Vapor turns to droplets",
        },
      ];

      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(expectedCards),
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 40, completion_tokens: 60, total_tokens: 100 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: formattedText }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(expectedCards);
    });
  });
});
