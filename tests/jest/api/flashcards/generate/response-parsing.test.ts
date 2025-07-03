import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/generate/route";
import { openai } from "@/lib/openai";
import { parseCompletionToCards } from "@/lib/flashcards";
import type {
  ChatCompletion,
  ChatCompletionMessage,
} from "openai/resources/chat/completions";

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

// Mock the flashcards module
jest.mock("@/lib/flashcards", () => ({
  parseCompletionToCards: jest.fn(),
}));

const mockOpenAI = openai.chat.completions.create as jest.MockedFunction<
  typeof openai.chat.completions.create
>;

const mockParseCompletionToCards = parseCompletionToCards as jest.MockedFunction<
  typeof parseCompletionToCards
>;

describe("API Route /api/flashcards/generate - Response Parsing", () => {
  const createValidRequest = () =>
    new NextRequest("http://localhost/api/flashcards/generate", {
      method: "POST",
      body: JSON.stringify({ text: "What is the capital of France?" }),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to use the real implementation by default
    mockParseCompletionToCards.mockReset();
    const { parseCompletionToCards } = jest.requireActual("@/lib/flashcards");
    mockParseCompletionToCards.mockImplementation(parseCompletionToCards);
  });

  describe("Invalid OpenAI response structure", () => {
    it("returns 502 when OpenAI response is null", async () => {
      mockOpenAI.mockResolvedValueOnce(null as unknown as ChatCompletion);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Received invalid response from OpenAI. Please try again."
      );
    });

    it("returns 502 when OpenAI response is undefined", async () => {
      mockOpenAI.mockResolvedValueOnce(undefined as unknown as ChatCompletion);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Received invalid response from OpenAI. Please try again."
      );
    });

    it("returns 502 when OpenAI response has no choices", async () => {
      const mockResponse: ChatCompletion = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Received invalid response from OpenAI. Please try again."
      );
    });

    it("returns 502 when OpenAI response choices is null", async () => {
      const mockResponse = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        choices: null,
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as unknown as ChatCompletion;

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Received invalid response from OpenAI. Please try again."
      );
    });

    it("returns 502 when OpenAI response choices is undefined", async () => {
      const mockResponse = {
        id: "test",
        object: "chat.completion",
        created: 123456789,
        model: "gpt-3.5-turbo",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      } as unknown as ChatCompletion;

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Received invalid response from OpenAI. Please try again."
      );
    });
  });

  describe("Empty response content", () => {
    it("returns 502 when message content is null", async () => {
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
              content: null,
              refusal: null,
            } as ChatCompletionMessage,
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI returned an empty response. Please try again with different text."
      );
    });

    it("returns 502 when message content is empty string", async () => {
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
              content: "",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI returned an empty response. Please try again with different text."
      );
    });

    it("returns 502 when message content is only whitespace", async () => {
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
              content: "   \n\t  ",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI returned an empty response. Please try again with different text."
      );
    });
  });

  describe("Malformed JSON responses", () => {
    it("returns 200 with empty cards when OpenAI returns invalid JSON", async () => {
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
              content: "This is not valid JSON {",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });

    it("returns 502 when OpenAI returns JSON that doesn't match expected format", async () => {
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
              content: '{"not": "flashcards", "format": "wrong"}',
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });

    it("returns 200 with empty cards when OpenAI returns text that cannot be parsed as flashcards", async () => {
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
              content: "This is just plain text without any flashcard format.",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });
  });

  describe("Valid responses with edge cases", () => {
    it("returns 200 with empty cards array when OpenAI returns valid but empty JSON array", async () => {
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

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });

    it("returns 200 with cards when OpenAI returns valid JSON flashcards", async () => {
      const validFlashcards = [
        { question: "What is the capital of France?", answer: "Paris" },
        { question: "What is 2 + 2?", answer: "4" },
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

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual(validFlashcards);
    });

    it("returns 200 with cards when OpenAI returns Q: A: format", async () => {
      const qaFormat = `Q: What is the capital of France?
A: Paris

Q: What is 2 + 2?
A: 4`;

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

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([
        { question: "What is the capital of France?", answer: "Paris" },
        { question: "What is 2 + 2?", answer: "4" },
      ]);
    });
  });

  describe("Parsing errors", () => {
    it("returns 502 when parseCompletionToCards throws an unexpected error", async () => {
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
              content: "Valid response content",
              refusal: null,
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockOpenAI.mockResolvedValueOnce(mockResponse);
      mockParseCompletionToCards.mockImplementation(() => {
        throw new Error("Unexpected parsing error");
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Unable to parse the generated content into flashcards. Please try again."
      );
    });
  });
});
