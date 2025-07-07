import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/extract-text/route";
import PDFParser from "pdf2json";

// Mock the pdf2json module
jest.mock("pdf2json");

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

describe("API Route /api/flashcards/extract-text - Integration Tests", () => {
  let mockPDFParser: MockPDFParser;

  const createValidRequest = (url: string = "https://example.com/test.txt") =>
    new NextRequest("http://localhost/api/flashcards/extract-text", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });

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

  describe("End-to-end successful scenarios", () => {
    it("successfully extracts text from a simple text file", async () => {
      const testText =
        "This is a comprehensive test of the extract-text route.\nIt should handle this content correctly.";

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
      expect(data).toEqual({ text: testText });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/document.txt"
      );
    });

    it("successfully extracts text from a PDF file", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  { T: "This%20is%20a%20PDF%20document" },
                  { T: "with%20multiple%20text%20segments" },
                ],
              },
              {
                R: [{ T: "Second%20text%20block" }],
              },
            ],
          },
          {
            Texts: [
              {
                R: [{ T: "Second%20page%20content" }],
              },
            ],
          },
        ],
      };

      const pdfBuffer = Buffer.alloc(1000);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(
        createValidRequest("https://example.com/document.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(
        "This is a PDF documentwith multiple text segments Second text block \n\nSecond page content \n\n"
      );
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });

    it("handles PDF detection by file extension", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "PDF%20detected%20by%20extension" }],
              },
            ],
          },
        ],
      };

      // Mock response without PDF content-type but with .pdf extension
      const pdfBuffer = Buffer.alloc(500);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/octet-stream"]]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(
        createValidRequest("https://example.com/mystery.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("PDF detected by extension \n\n");
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });

    it("processes various text file formats correctly", async () => {
      const testCases = [
        {
          url: "https://example.com/document.html",
          contentType: "text/html",
          content:
            "<html><body><h1>HTML Title</h1><p>HTML content</p></body></html>",
        },
        {
          url: "https://example.com/data.json",
          contentType: "application/json",
          content: '{"name": "test", "value": 123}',
        },
        {
          url: "https://example.com/style.css",
          contentType: "text/css",
          content: "body { margin: 0; padding: 10px; }",
        },
        {
          url: "https://example.com/script.js",
          contentType: "application/javascript",
          content: "function test() { return 'hello'; }",
        },
      ];

      for (const testCase of testCases) {
        const buffer = Buffer.from(testCase.content, "utf-8");
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          headers: new Headers([["content-type", testCase.contentType]]),
          arrayBuffer: () =>
            Promise.resolve(
              buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
              )
            ),
        });

        const response = await POST(createValidRequest(testCase.url));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.text).toBe(testCase.content);

        jest.clearAllMocks();
      }
    });

    it("handles URLs with complex query parameters and fragments", async () => {
      const complexUrl =
        "https://example.com/file.txt?version=2&format=plain&token=abc123#section1";
      const testText = "Content from complex URL";

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

      const response = await POST(createValidRequest(complexUrl));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
      expect(global.fetch).toHaveBeenCalledWith(complexUrl);
    });
  });

  describe("Complete error handling workflows", () => {
    it("handles complete network failure workflow", async () => {
      const networkError = new Error("Network is unreachable");
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const response = await POST(
        createValidRequest("https://unreachable.com/file.txt")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Network is unreachable");
    });

    it("handles complete PDF parsing failure workflow", async () => {
      const pdfError = new Error("Corrupted PDF file");

      const pdfBuffer = Buffer.alloc(100);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataError") {
            setImmediate(() => callback(pdfError));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(
        createValidRequest("https://example.com/broken.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Corrupted PDF file");
    });

    it("handles HTTP error response workflow", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const response = await POST(
        createValidRequest("https://example.com/missing.txt")
      );
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe("Failed to fetch file: 404");
    });

    it("handles malformed request body workflow", async () => {
      const request = new NextRequest(
        "http://localhost/api/flashcards/extract-text",
        {
          method: "POST",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Unexpected token");
    });
  });

  describe("Content type detection and processing", () => {
    it("correctly processes files based on content-type header", async () => {
      const testContent = "Content with explicit type";

      const buffer = Buffer.from(testContent, "utf-8");
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

      const response = await POST(
        createValidRequest("https://example.com/file")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testContent);
    });

    it("correctly processes PDF files based on content-type", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "PDF%20by%20content%20type" }],
              },
            ],
          },
        ],
      };

      const pdfBuffer = Buffer.alloc(200);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(
        createValidRequest("https://example.com/document")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("PDF by content type \n\n");
    });

    it("prioritizes file extension when content-type is ambiguous", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "Extension%20wins" }],
              },
            ],
          },
        ],
      };

      // Ambiguous content-type but clear .pdf extension
      const pdfBuffer = Buffer.alloc(150);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/octet-stream"]]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(
        createValidRequest("https://example.com/file.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("Extension wins \n\n");
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });

    it("handles missing content-type gracefully", async () => {
      const testContent = "No content type header";

      const buffer = Buffer.from(testContent, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(), // No content-type header
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://example.com/unknown")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testContent);
    });
  });

  describe("Real-world integration scenarios", () => {
    it("handles a typical document processing workflow", async () => {
      // Simulate processing a real document URL
      const documentText = `
        Document Title: Research Paper
        
        Abstract:
        This paper discusses the implementation of automated text extraction
        from various document formats including PDF and plain text files.
        
        Introduction:
        Modern applications require robust document processing capabilities
        to extract meaningful content for further analysis and processing.
        
        Conclusion:
        The proposed solution provides efficient text extraction with
        comprehensive error handling and format support.
      `.trim();

      const buffer = Buffer.from(documentText, "utf-8");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", documentText.length.toString()],
          ["server", "nginx/1.18.0"],
          ["date", new Date().toUTCString()],
        ]),
        arrayBuffer: () =>
          Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          ),
      });

      const response = await POST(
        createValidRequest("https://research.example.com/papers/document.txt")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(documentText);
      expect(data.text).toContain("Research Paper");
      expect(data.text).toContain("Abstract:");
      expect(data.text).toContain("Conclusion:");
    });

    it("handles a multi-page PDF processing workflow", async () => {
      const mockComplexPDF = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  { T: "Chapter%201%3A%20Introduction" },
                  { T: "This%20chapter%20introduces%20the%20main%20concepts." },
                ],
              },
              {
                R: [
                  { T: "Section%201.1%3A%20Overview" },
                  { T: "The%20overview%20provides%20context." },
                ],
              },
            ],
          },
          {
            Texts: [
              {
                R: [
                  { T: "Chapter%202%3A%20Implementation" },
                  { T: "This%20chapter%20covers%20implementation%20details." },
                ],
              },
            ],
          },
          {
            Texts: [
              {
                R: [
                  { T: "Chapter%203%3A%20Conclusion" },
                  { T: "Final%20thoughts%20and%20recommendations." },
                ],
              },
            ],
          },
        ],
      };

      const pdfBuffer = Buffer.alloc(2048576);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "application/pdf"],
          ["content-length", "2048576"], // 2MB
          ["content-disposition", "attachment; filename=research.pdf"],
        ]),
        arrayBuffer: () =>
          Promise.resolve(
            pdfBuffer.buffer.slice(
              pdfBuffer.byteOffset,
              pdfBuffer.byteOffset + pdfBuffer.byteLength
            )
          ),
      });

      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockComplexPDF));
          }
          return mockPDFParser;
        }
      );

      const startTime = Date.now();
      const response = await POST(
        createValidRequest("https://documents.example.com/research.pdf")
      );
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toContain("Chapter 1: Introduction");
      expect(data.text).toContain("Chapter 2: Implementation");
      expect(data.text).toContain("Chapter 3: Conclusion");
      expect(data.text).toContain("This chapter introduces the main concepts");
      expect(data.text).toContain("Final thoughts and recommendations");

      // Should process within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("handles concurrent requests efficiently", async () => {
      const requests = [
        { url: "https://example.com/doc1.txt", content: "Document 1 content" },
        { url: "https://example.com/doc2.txt", content: "Document 2 content" },
        { url: "https://example.com/doc3.txt", content: "Document 3 content" },
      ];

      // Mock all fetch calls
      requests.forEach((req) => {
        const buffer = Buffer.from(req.content, "utf-8");
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
      });

      // Make concurrent requests
      const responsePromises = requests.map((req) =>
        POST(createValidRequest(req.url))
      );

      const responses = await Promise.all(responsePromises);
      const dataPromises = responses.map((res) => res.json());
      const results = await Promise.all(dataPromises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Content should match
      results.forEach((data, index) => {
        expect(data.text).toBe(requests[index].content);
      });
    });
  });

  describe("Response format validation", () => {
    it("returns consistent response format for successful text extraction", async () => {
      const testText = "Consistent format test";

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
      expect(data).toHaveProperty("text");
      expect(typeof data.text).toBe("string");
      expect(data.text).toBe(testText);
      expect(Object.keys(data)).toEqual(["text"]);
    });

    it("returns consistent error format for failures", async () => {
      const errorMessage = "Test error";
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
      expect(data.error).toBe(errorMessage);
      expect(Object.keys(data)).toEqual(["error"]);
    });

    it("handles non-Error objects consistently", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce("String error");

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("String error");
    });

    it("handles null/undefined errors consistently", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(null);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown error");
    });
  });
});
