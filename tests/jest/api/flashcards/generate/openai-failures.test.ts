import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/generate/route";
import { openai } from "@/lib/openai";

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

describe("API Route /api/flashcards/generate - OpenAI API Failures", () => {
  const createValidRequest = () =>
    new NextRequest("http://localhost/api/flashcards/generate", {
      method: "POST",
      body: JSON.stringify({ text: "What is the capital of France?" }),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rate limiting errors", () => {
    it("returns 429 when OpenAI API returns rate limit error", async () => {
      const rateLimitError = new Error("Rate limit exceeded") as Error & {
        status: number;
      };
      rateLimitError.status = 429;
      mockOpenAI.mockRejectedValueOnce(rateLimitError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Rate limit exceeded. Please try again later.");
    });
  });

  describe("Authentication errors", () => {
    it("returns 502 when OpenAI API returns 401 authentication error", async () => {
      const authError = new Error("Invalid API key") as Error & {
        status: number;
      };
      authError.status = 401;
      mockOpenAI.mockRejectedValueOnce(authError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Authentication failed. Please check API configuration."
      );
    });

    it("returns 502 when OpenAI API returns 403 forbidden error", async () => {
      const forbiddenError = new Error("Access forbidden") as Error & {
        status: number;
      };
      forbiddenError.status = 403;
      mockOpenAI.mockRejectedValueOnce(forbiddenError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Access forbidden. Please check API permissions."
      );
    });
  });

  describe("Request size errors", () => {
    it("returns 413 when OpenAI API returns request too large error", async () => {
      const requestTooLargeError = new Error("Request too large") as Error & {
        status: number;
      };
      requestTooLargeError.status = 413;
      mockOpenAI.mockRejectedValueOnce(requestTooLargeError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.error).toBe(
        "Request too large. Please reduce the text length."
      );
    });
  });

  describe("Server errors", () => {
    it("returns 502 when OpenAI API returns 500 internal server error", async () => {
      const serverError = new Error("Internal server error") as Error & {
        status: number;
      };
      serverError.status = 500;
      mockOpenAI.mockRejectedValueOnce(serverError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI service temporarily unavailable. Please try again later."
      );
    });

    it("returns 502 when OpenAI API returns 502 bad gateway error", async () => {
      const badGatewayError = new Error("Bad gateway") as Error & {
        status: number;
      };
      badGatewayError.status = 502;
      mockOpenAI.mockRejectedValueOnce(badGatewayError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI service temporarily unavailable. Please try again later."
      );
    });

    it("returns 502 when OpenAI API returns 503 service unavailable error", async () => {
      const serviceUnavailableError = new Error(
        "Service unavailable"
      ) as Error & { status: number };
      serviceUnavailableError.status = 503;
      mockOpenAI.mockRejectedValueOnce(serviceUnavailableError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "OpenAI service temporarily unavailable. Please try again later."
      );
    });
  });

  describe("Network errors", () => {
    it("returns 502 when network connection is refused", async () => {
      const connectionError = new Error("Connection refused") as Error & {
        code: string;
      };
      connectionError.code = "ECONNREFUSED";
      mockOpenAI.mockRejectedValueOnce(connectionError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Network connection failed. Please check your internet connection."
      );
    });

    it("returns 502 when network connection times out", async () => {
      const timeoutError = new Error("Connection timeout") as Error & {
        code: string;
      };
      timeoutError.code = "ETIMEDOUT";
      mockOpenAI.mockRejectedValueOnce(timeoutError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Network connection failed. Please check your internet connection."
      );
    });
  });

  describe("Unknown errors", () => {
    it("returns 502 when OpenAI API returns unknown status code", async () => {
      const unknownError = new Error("Unknown error") as Error & {
        status: number;
      };
      unknownError.status = 418; // I'm a teapot
      mockOpenAI.mockRejectedValueOnce(unknownError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Failed to generate flashcards. Please try again."
      );
    });

    it("returns 502 when OpenAI API throws generic error without status", async () => {
      const genericError = new Error("Something went wrong");
      mockOpenAI.mockRejectedValueOnce(genericError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Failed to generate flashcards. Please try again."
      );
    });

    it("returns 502 when OpenAI API throws non-Error object", async () => {
      mockOpenAI.mockRejectedValueOnce("String error");

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Failed to generate flashcards. Please try again."
      );
    });

    it("returns 502 when OpenAI API throws null", async () => {
      mockOpenAI.mockRejectedValueOnce(null);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe(
        "Failed to generate flashcards. Please try again."
      );
    });
  });
});
