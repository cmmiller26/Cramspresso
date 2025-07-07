import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/extract-text/route";

// Mock the pdf2json module
jest.mock("pdf2json", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    parseBuffer: jest.fn(),
  }));
});

// Mock fetch
global.fetch = jest.fn();

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

describe("API Route /api/flashcards/extract-text - Text Processing", () => {
  const createValidRequest = (url: string = "https://example.com/test.txt") =>
    new NextRequest("http://localhost/api/flashcards/extract-text", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Plain text file processing", () => {
    it("successfully processes simple text files", async () => {
      const testText =
        "This is a simple text file.\nWith multiple lines.\nAnd various content.";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("handles text files with UTF-8 encoding", async () => {
      const testText = "Special characters: éñüñéëçã 中文 العربية русский";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain; charset=utf-8"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("handles empty text files", async () => {
      const emptyBuffer = Buffer.alloc(0);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            emptyBuffer.buffer.slice(
              emptyBuffer.byteOffset,
              emptyBuffer.byteOffset + emptyBuffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("");
    });

    it("handles very large text files", async () => {
      // Create a large text content (1MB)
      const largeText = "Lorem ipsum dolor sit amet. ".repeat(40000);

      const buffer = Buffer.from(largeText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(largeText);
      expect(data.text.length).toBeGreaterThan(1000000);
    });

    it("handles text files with various line endings", async () => {
      const testCases = [
        { name: "Unix (LF)", content: "Line 1\nLine 2\nLine 3" },
        { name: "Windows (CRLF)", content: "Line 1\r\nLine 2\r\nLine 3" },
        { name: "Mac (CR)", content: "Line 1\rLine 2\rLine 3" },
        { name: "Mixed", content: "Line 1\nLine 2\r\nLine 3\rLine 4" },
      ];

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          headers: new Headers([["content-type", "text/plain"]]),
          arrayBuffer: () => {
            const buffer = Buffer.from(testCase.content, "utf-8");
            return Promise.resolve(
              buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
              )
            );
          },
        });

        const response = await POST(createValidRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.text).toBe(testCase.content);

        jest.clearAllMocks();
      }
    });

    it("handles text files with special whitespace characters", async () => {
      const testText =
        "Text with\ttabs\nand   multiple    spaces\u00A0and\u2003various\u2009whitespace";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });
  });

  describe("Different text file formats", () => {
    it("processes .txt files correctly", async () => {
      const testText = "Plain text file content";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/document.txt")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("processes markdown files as text", async () => {
      const markdownContent =
        "# Header\n\n## Subheader\n\n- List item 1\n- List item 2\n\n**Bold text** and *italic text*";

      const buffer = Buffer.from(markdownContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/markdown"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/document.md")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(markdownContent);
    });

    it("processes CSV files as text", async () => {
      const csvContent =
        "Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles\nBob,35,Chicago";

      const buffer = Buffer.from(csvContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/csv"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/data.csv")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(csvContent);
    });

    it("processes HTML files as text (raw HTML)", async () => {
      const htmlContent =
        "<html><head><title>Test</title></head><body><h1>Hello World</h1><p>This is a paragraph.</p></body></html>";

      const buffer = Buffer.from(htmlContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/html"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/page.html")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(htmlContent);
    });

    it("processes JSON files as text", async () => {
      const jsonContent =
        '{"name": "John", "age": 30, "city": "New York", "hobbies": ["reading", "swimming"]}';

      const buffer = Buffer.from(jsonContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/json"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/data.json")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(jsonContent);
    });

    it("processes XML files as text", async () => {
      const xmlContent =
        '<?xml version="1.0" encoding="UTF-8"?><root><person><name>John</name><age>30</age></person></root>';

      const buffer = Buffer.from(xmlContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/xml"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/data.xml")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(xmlContent);
    });
  });

  describe("Text encoding handling", () => {
    it("handles ASCII text correctly", async () => {
      const asciiText = "Simple ASCII text without special characters";

      const buffer = Buffer.from(asciiText, "ascii");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain; charset=ascii"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(asciiText);
    });

    it("handles Latin-1 encoded text", async () => {
      const latinText = "Café naïve résumé";

      const buffer = Buffer.from(latinText, "latin1");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain; charset=iso-8859-1"],
        ]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      // Note: The route assumes UTF-8 encoding, so Latin-1 may not decode correctly
      // This test documents the current behavior
      expect(typeof data.text).toBe("string");
    });

    it("handles text with BOM (Byte Order Mark)", async () => {
      const textContent = "Text with BOM";
      const bomUtf8 = Buffer.from([0xef, 0xbb, 0xbf]); // UTF-8 BOM
      const textBuffer = Buffer.from(textContent, "utf-8");
      const combinedBuffer = Buffer.concat([bomUtf8, textBuffer]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            combinedBuffer.buffer.slice(
              combinedBuffer.byteOffset,
              combinedBuffer.byteOffset + combinedBuffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      // The BOM should be included in the text (current implementation doesn't strip it)
      expect(data.text).toContain(textContent);
    });

    it("handles potentially corrupted text encoding gracefully", async () => {
      // Create invalid UTF-8 sequence
      const invalidUtf8 = Buffer.from([0xff, 0xfe, 0x41, 0x42, 0x43]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            invalidUtf8.buffer.slice(
              invalidUtf8.byteOffset,
              invalidUtf8.byteOffset + invalidUtf8.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should handle invalid UTF-8 gracefully (may include replacement characters)
      expect(typeof data.text).toBe("string");
    });
  });

  describe("Content type detection", () => {
    it("treats unknown content types as text", async () => {
      const testText = "Unknown content type text";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/unknown"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("handles missing content-type header as text", async () => {
      const testText = "Text without content type";

      const buffer = Buffer.from(testText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("processes binary files as text when not PDF", async () => {
      const binaryData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]); // PNG header

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "image/png"]]),
        arrayBuffer: () =>
          Promise.resolve(
            binaryData.buffer.slice(
              binaryData.byteOffset,
              binaryData.byteOffset + binaryData.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/image.png")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      // Binary data treated as text will likely produce garbled output
      expect(typeof data.text).toBe("string");
    });
  });

  describe("Buffer processing edge cases", () => {
    it("handles zero-length buffers", async () => {
      const emptyBuffer = Buffer.alloc(0);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            emptyBuffer.buffer.slice(
              emptyBuffer.byteOffset,
              emptyBuffer.byteOffset + emptyBuffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("");
    });

    it("handles very small buffers", async () => {
      const singleChar = "A";

      const buffer = Buffer.from(singleChar, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(singleChar);
    });

    it("handles text with null characters", async () => {
      const textWithNulls = "Text\x00with\x00null\x00characters";

      const buffer = Buffer.from(textWithNulls, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(textWithNulls);
    });

    it("handles text with control characters", async () => {
      const textWithControls = "Text\twith\nvarious\rcontrol\fcharacters\b";

      const buffer = Buffer.from(textWithControls, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(textWithControls);
    });
  });

  describe("Performance and memory handling", () => {
    it("handles moderately large text files efficiently", async () => {
      // Create a 100KB text file
      const mediumText =
        "This is a line of text that will be repeated many times.\n".repeat(
          2000
        );

      const buffer = Buffer.from(mediumText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const startTime = Date.now();
      const response = await POST(createValidRequest());
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(mediumText);
      expect(data.text.length).toBeGreaterThan(100000);

      // Should process reasonably quickly (less than 1 second for 100KB)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("processes text files with many lines efficiently", async () => {
      // Create text with many short lines
      const manyLines = Array.from(
        { length: 10000 },
        (_, i) => `Line ${i + 1}`
      ).join("\n");

      const buffer = Buffer.from(manyLines, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(manyLines);
      expect(data.text.split("\n")).toHaveLength(10000);
    });
  });
});
