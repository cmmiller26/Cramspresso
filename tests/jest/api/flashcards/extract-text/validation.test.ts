import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/extract-text/route";
import PDFParser from "pdf2json";

// Mock the pdf2json module
jest.mock("pdf2json");

// Mock fetch
global.fetch = jest.fn();

const MockedPDFParser = PDFParser as jest.MockedClass<typeof PDFParser>;

// Define callback types for PDF parser events
type PDFParserCallback = (data: unknown) => void;

// Mock PDF parser interface
interface MockPDFParser {
  on: jest.MockedFunction<
    (event: string, callback: PDFParserCallback) => MockPDFParser
  >;
  parseBuffer: jest.MockedFunction<(buffer: Buffer) => MockPDFParser>;
}

// Mock Headers to handle case-insensitive header access
global.Headers = class MockHeaders extends Map {
  get(name: string): string | null {
    return super.get(name.toLowerCase()) || null;
  }
  set(name: string, value: string): this {
    super.set(name.toLowerCase(), value);
    return this;
  }
  has(name: string): boolean {
    return super.has(name.toLowerCase());
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("API Route /api/flashcards/extract-text - Input Validation", () => {
  let mockPDFParser: MockPDFParser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPDFParser = {
      on: jest.fn().mockReturnThis(),
      parseBuffer: jest.fn().mockReturnThis(),
    } as MockPDFParser;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MockedPDFParser as any).mockImplementation(
      () => mockPDFParser
    );
  });

  describe("Invalid request body", () => {
    it("returns 400 when url field is missing", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing URL");
    });

    it("returns 400 when url is not a string", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: 123 }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing URL");
    });

    it("returns 400 when url is an empty string", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: "" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing URL");
    });

    it("returns 400 when url is only whitespace", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: "   \n\t  " }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing URL");
    });

    it("returns 400 when url is null", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: null }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing URL");
    });
  });

  describe("Malformed request data", () => {
    it("returns 500 when request body is invalid JSON", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: "invalid json {",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Unexpected token");
    });

    it("returns 500 when request body is empty", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: "",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Unexpected end of JSON input");
    });

    it("handles missing Content-Type header gracefully", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: "https://example.com/test.pdf" }),
        }
      );

      // Mock successful fetch response
      const emptyBuffer = Buffer.alloc(0);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () =>
          Promise.resolve(
            emptyBuffer.buffer.slice(
              emptyBuffer.byteOffset,
              emptyBuffer.byteOffset + emptyBuffer.byteLength
            )
          ),
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback({ Pages: [] }));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(request);

      // Should not fail due to missing Content-Type header
      expect(response.status).not.toBe(400);
    });
  });

  describe("Invalid URL formats", () => {
    it("handles malformed URLs gracefully", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: "not-a-valid-url" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Mock fetch to throw an error for invalid URL
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch");
    });

    it("handles URLs with special characters", async () => {
      const specialUrl = "https://example.com/file with spaces.pdf";
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: specialUrl }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Mock fetch to throw an error for special characters
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch");
    });

    it("handles extremely long URLs", async () => {
      const longUrl = "https://example.com/" + "a".repeat(2000) + ".pdf";
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: longUrl }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Mock fetch to reject for extremely long URL
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch");
    });
  });

  describe("Request method validation", () => {
    it("only accepts POST requests", async () => {
      // Note: This test verifies that the route handler is properly configured
      // The actual method validation is handled by Next.js routing
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: JSON.stringify({ url: "https://example.com/test.pdf" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Mock successful fetch response
      const emptyBuffer = Buffer.alloc(0);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () =>
          Promise.resolve(
            emptyBuffer.buffer.slice(
              emptyBuffer.byteOffset,
              emptyBuffer.byteOffset + emptyBuffer.byteLength
            )
          ),
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback({ Pages: [] }));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(request);

      // Should accept POST method
      expect(response.status).not.toBe(405);
    });
  });
});
