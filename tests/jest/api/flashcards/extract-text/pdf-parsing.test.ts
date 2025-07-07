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

describe("API Route /api/flashcards/extract-text - PDF Parsing", () => {
  let mockPDFParser: MockPDFParser;

  const createValidRequest = (url: string = "https://example.com/test.pdf") =>
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

  describe("Successful PDF parsing", () => {
    it("extracts text from a simple PDF with one page", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "Hello%20World" }, { T: "This%20is%20a%20test" }],
              },
              {
                R: [{ T: "Second%20line" }],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("Hello WorldThis is a test Second line \n\n");
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });

    it("extracts text from a multi-page PDF", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "Page%201%20content" }],
              },
            ],
          },
          {
            Texts: [
              {
                R: [{ T: "Page%202%20content" }],
              },
            ],
          },
          {
            Texts: [
              {
                R: [{ T: "Page%203%20content" }],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(200);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(
        "Page 1 content \n\nPage 2 content \n\nPage 3 content \n\n"
      );
    });

    it("handles PDF with mixed content (text and images)", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  { T: "Text%20before%20image" },
                  { T: "Text%20after%20image" },
                ],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(300);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("Text before imageText after image \n\n");
    });

    it("handles empty PDF pages gracefully", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [],
          },
          {
            Texts: [
              {
                R: [{ T: "Only%20page%20with%20content" }],
              },
            ],
          },
          {
            Texts: [],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(150);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("\n\nOnly page with content \n\n\n\n");
    });

    it("handles PDF with complex text encoding", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  {
                    T: "Special%20characters%3A%20%C3%A9%C3%A1%C3%AD%C3%B3%C3%BA",
                  }, // éáíóú
                  { T: "Numbers%3A%20123%20456" },
                  { T: "Symbols%3A%20%40%23%24%25" }, // @#$%
                ],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toContain("Special characters: éáíóú");
      expect(data.text).toContain("Numbers: 123 456");
      expect(data.text).toContain("Symbols: @#$%");
    });

    it("detects PDF by file extension even without content-type", async () => {
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

      // Mock successful fetch without PDF content-type
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/octet-stream"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
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
      expect(data.text).toBe("PDF detected by extension \n\n");
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });
  });

  describe("PDF parsing failures", () => {
    it("returns 500 when PDF parsing fails", async () => {
      const parseError = new Error("Invalid PDF structure");

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser error
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataError") {
            setImmediate(() => callback(parseError));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Invalid PDF structure");
    });

    it("handles corrupted PDF files", async () => {
      const corruptionError = new Error("PDF file is corrupted or malformed");

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(50);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser error
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataError") {
            setImmediate(() => callback(corruptionError));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("PDF file is corrupted or malformed");
    });

    it("handles password-protected PDFs", async () => {
      const passwordError = new Error("PDF is password protected");

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser error
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataError") {
            setImmediate(() => callback(passwordError));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("PDF is password protected");
    });

    it("handles empty PDF files", async () => {
      const emptyError = new Error(
        "PDF file is empty or has no readable content"
      );

      // Mock successful fetch with empty buffer
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(0);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser error
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataError") {
            setImmediate(() => callback(emptyError));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("PDF file is empty or has no readable content");
    });

    it("handles PDFs with no extractable text", async () => {
      const mockPDFData = {
        Pages: [],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success but with no pages
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("");
    });

    it("handles PDF parser initialization without events", async () => {
      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser that sets up but doesn't emit events
      mockPDFParser.on.mockImplementation(() => {
        // Just return without emitting events
        return mockPDFParser;
      });

      // This will hang in real implementation, so we test that setup occurs
      // but don't await the promise
      POST(createValidRequest());

      // The POST call will trigger parseBuffer even if events don't fire
      setTimeout(() => {
        expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
      }, 10);

      // Wait a bit for the test to complete
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  });

  describe("PDF content edge cases", () => {
    it("handles PDFs with only whitespace", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  { T: "%20%20%20" }, // Just spaces
                  { T: "%0A%0A" }, // Just newlines
                ],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("   \n\n \n\n");
    });

    it("handles PDFs with malformed text segments", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [
                  { T: "Valid%20text" },
                  { T: "" }, // Empty segment
                  { T: "More%20valid%20text" },
                ],
              },
            ],
          },
        ],
      };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("Valid textMore valid text \n\n");
    });

    it("handles very large PDFs", async () => {
      // Create a mock PDF with many pages and lots of text
      const pages = [];
      for (let i = 0; i < 100; i++) {
        pages.push({
          Texts: [
            {
              R: [{ T: `Page%20${i}%20content%20`.repeat(100) }],
            },
          ],
        });
      }

      const mockPDFData = { Pages: pages };

      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(1000000);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser success
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback(mockPDFData));
          }
          return mockPDFParser;
        }
      );

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text.length).toBeGreaterThan(10000); // Should be a large response
      expect(data.text).toContain("Page 0 content");
      expect(data.text).toContain("Page 99 content");
    });
  });

  describe("PDF parser setup and configuration", () => {
    it("creates a new PDF parser instance for each request", async () => {
      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
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

      // Make two requests
      await POST(createValidRequest());
      await POST(createValidRequest());

      // Should create two parser instances
      expect(MockedPDFParser).toHaveBeenCalledTimes(2);
    });

    it("correctly sets up event listeners", async () => {
      // Mock successful fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/pdf"]]),
        arrayBuffer: () => {
          const buffer = Buffer.alloc(100);
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      // Mock PDF parser with proper response
      mockPDFParser.on.mockImplementation(
        (event: string, callback: PDFParserCallback) => {
          if (event === "pdfParser_dataReady") {
            setImmediate(() => callback({ Pages: [] }));
          }
          return mockPDFParser;
        }
      );

      await POST(createValidRequest());

      // Should set up both error and success event listeners
      expect(mockPDFParser.on).toHaveBeenCalledWith(
        "pdfParser_dataError",
        expect.any(Function)
      );
      expect(mockPDFParser.on).toHaveBeenCalledWith(
        "pdfParser_dataReady",
        expect.any(Function)
      );
      expect(mockPDFParser.parseBuffer).toHaveBeenCalled();
    });
  });
});
