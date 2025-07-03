import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/generate/route";

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

describe("API Route /api/flashcards/generate - Input Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Invalid request body", () => {
    it("returns 400 when text field is missing", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is not a string", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: 123 }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is null", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: null }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is undefined", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: undefined }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is empty string", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: "" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is only whitespace", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: "   \n\t  " }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is an array", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: ["some", "text"] }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });

    it("returns 400 when text is an object", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: JSON.stringify({ text: { content: "some text" } }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request body. Text must be a non-empty string."
      );
    });
  });

  describe("Invalid JSON request body", () => {
    it("returns 400 when request body is not valid JSON", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: "invalid json {",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request format. Please ensure you're sending valid JSON."
      );
    });

    it("returns 400 when request body is empty", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/generate",
        {
          method: "POST",
          body: "",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Invalid request format. Please ensure you're sending valid JSON."
      );
    });
  });
});
