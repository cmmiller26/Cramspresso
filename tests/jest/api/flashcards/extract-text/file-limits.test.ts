import { NextRequest } from "next/server";
import { POST } from "@/app/api/flashcards/extract-text/route";
import PDFParser from "pdf2json";

// Mock the pdf2json module
jest.mock("pdf2json", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    parseBuffer: jest.fn(),
  }));
});

// Mock fetch
global.fetch = jest.fn();

// Mock Headers
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

describe("API Route /api/flashcards/extract-text - File Limits and Size Handling", () => {
  const createValidRequest = (url: string = "https://example.com/test.txt") =>
    new NextRequest("http://localhost/api/flashcards/extract-text", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("File size boundaries", () => {
    it("handles very small files (1 byte)", async () => {
      const smallContent = "A";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", "1"],
        ]),
        arrayBuffer: () => {
          const buffer = Buffer.from(smallContent, "utf-8");
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
      expect(data.text).toBe(smallContent);
    });

    it("handles empty files (0 bytes)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", "0"],
        ]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("");
    });

    it("handles medium-sized files (100KB)", async () => {
      const mediumContent = "x".repeat(100 * 1024); // 100KB

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", "102400"],
        ]),
        arrayBuffer: () => {
          const buffer = Buffer.from(mediumContent, "utf-8");
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
      expect(data.text).toBe(mediumContent);
      expect(data.text.length).toBe(100 * 1024);
    });

    it("handles large files (5MB)", async () => {
      const largeContent = "Lorem ipsum dolor sit amet. ".repeat(200000); // ~5MB

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", largeContent.length.toString()],
        ]),
        arrayBuffer: () => {
          const buffer = Buffer.from(largeContent, "utf-8");
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
      expect(data.text).toBe(largeContent);
      expect(data.text.length).toBeGreaterThan(5 * 1024 * 1024);
    });

    it("handles very large files (50MB) - potential memory limits", async () => {
      // Note: This test may take time and memory - adjust based on system limits
      const veryLargeContent = "A".repeat(50 * 1024 * 1024); // 50MB

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", "52428800"],
        ]),
        arrayBuffer: () => {
          const buffer = Buffer.from(veryLargeContent, "utf-8");
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

      // This test verifies that the system can handle large files
      // In production, you might want to implement file size limits
      expect(response.status).toBe(200);
      expect(data.text.length).toBe(50 * 1024 * 1024);
    });
  });

  describe("Memory pressure scenarios", () => {
    it("handles multiple concurrent large file requests", async () => {
      const largeContent = "x".repeat(1024 * 1024); // 1MB each

      // Mock multiple large responses
      for (let i = 0; i < 5; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          headers: new Headers([["content-type", "text/plain"]]),
          arrayBuffer: () => {
            const buffer = Buffer.from(largeContent, "utf-8");
            return Promise.resolve(
              buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength
              )
            );
          },
        });
      }

      // Make multiple concurrent requests
      const requests = Array.from({ length: 5 }, () =>
        POST(createValidRequest())
      );
      const responses = await Promise.all(requests);
      const dataPromises = responses.map((response) => response.json());
      const results = await Promise.all(dataPromises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      results.forEach((data) => {
        expect(data.text).toBe(largeContent);
        expect(data.text.length).toBe(1024 * 1024);
      });
    });

    it("handles files with repetitive patterns efficiently", async () => {
      // Test with highly repetitive content that might be compressed
      const repetitiveContent = "ABCD".repeat(250000); // 1MB of repetitive pattern

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(repetitiveContent, "utf-8");
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      const startTime = Date.now();
      const response = await POST(createValidRequest());
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(repetitiveContent);

      // Should process efficiently even with repetitive content
      expect(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
    });

    it("handles files with many special characters", async () => {
      // Create content with many Unicode characters that might affect memory usage
      const specialChars = "🎉💻📝🚀✨🎯🔥💡⭐🌟💫🎊🎈🎪🎭🎨🎯🎲🎸🎺🎷🎹";
      const specialContent = specialChars.repeat(10000); // Lots of Unicode

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(specialContent, "utf-8");
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
      expect(data.text).toBe(specialContent);
    });
  });

  describe("PDF file size limits", () => {
    it("handles small PDF files", async () => {
      const mockPDFData = {
        Pages: [
          {
            Texts: [
              {
                R: [{ T: "Small%20PDF%20content" }],
              },
            ],
          },
        ],
      };

      // Mock successful fetch for small PDF
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "application/pdf"],
          ["content-length", "1024"],
        ]),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      });

      // Mock pdf2json
      const MockedPDFParser = PDFParser as jest.MockedClass<typeof PDFParser>;
      const mockParser = {
        on: jest
          .fn()
          .mockImplementation(
            (event: string, callback: (data: unknown) => void) => {
              if (event === "pdfParser_dataReady") {
                setTimeout(() => callback(mockPDFData), 0);
              }
            }
          ),
        parseBuffer: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockedPDFParser as any).mockImplementation(() => mockParser);

      const response = await POST(
        createValidRequest("https://example.com/small.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe("Small PDF content \n\n");
    });

    it("handles large PDF files", async () => {
      // Create mock data for a large PDF with many pages
      const pages = Array.from({ length: 100 }, (_, i) => ({
        Texts: [
          {
            R: [{ T: `Page%20${i + 1}%20content%20`.repeat(50) }],
          },
        ],
      }));

      const mockPDFData = { Pages: pages };

      // Mock successful fetch for large PDF
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "application/pdf"],
          ["content-length", "10485760"],
        ]), // 10MB
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10 * 1024 * 1024)),
      });

      // Mock pdf2json
      const MockedPDFParser = PDFParser as jest.MockedClass<typeof PDFParser>;
      const mockParser = {
        on: jest
          .fn()
          .mockImplementation(
            (event: string, callback: (data: unknown) => void) => {
              if (event === "pdfParser_dataReady") {
                setTimeout(() => callback(mockPDFData), 0);
              }
            }
          ),
        parseBuffer: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockedPDFParser as any).mockImplementation(() => mockParser);

      const response = await POST(
        createValidRequest("https://example.com/large.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text.length).toBeGreaterThan(10000);
      expect(data.text).toContain("Page 1 content");
      expect(data.text).toContain("Page 100 content");
    });

    it("handles PDF files that exceed reasonable processing limits", async () => {
      // Simulate a PDF that's too complex to process efficiently
      const hugePDFError = new Error(
        "PDF file too large or complex to process"
      );

      // Mock successful fetch but PDF parsing failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "application/pdf"],
          ["content-length", "104857600"],
        ]), // 100MB
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100 * 1024 * 1024)),
      });

      // Mock pdf2json to fail on huge file
      const MockedPDFParser = PDFParser as jest.MockedClass<typeof PDFParser>;
      const mockParser = {
        on: jest
          .fn()
          .mockImplementation(
            (event: string, callback: (error: Error) => void) => {
              if (event === "pdfParser_dataError") {
                setTimeout(() => callback(hugePDFError), 0);
              }
            }
          ),
        parseBuffer: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockedPDFParser as any).mockImplementation(() => mockParser);

      const response = await POST(
        createValidRequest("https://example.com/huge.pdf")
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("PDF file too large or complex to process");
    });
  });

  describe("Network transfer limits", () => {
    it("handles slow network transfers gracefully", async () => {
      const content = "Content transferred slowly";

      // Simulate slow transfer with delayed response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(
            (resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    headers: new Headers([["content-type", "text/plain"]]),
                    arrayBuffer: () => {
                      const buffer = Buffer.from(content, "utf-8");
                      return Promise.resolve(
                        buffer.buffer.slice(
                          buffer.byteOffset,
                          buffer.byteOffset + buffer.byteLength
                        )
                      );
                    },
                  }),
                100
              ) // 100ms delay
          )
      );

      const startTime = Date.now();
      const response = await POST(createValidRequest());
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(content);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("handles partial content downloads", async () => {
      // Simulate a scenario where content-length doesn't match actual content
      const content = "Partial content";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([
          ["content-type", "text/plain"],
          ["content-length", "1000"],
        ]), // Claims 1000 bytes
        arrayBuffer: () => {
          const buffer = Buffer.from(content, "utf-8");
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        }, // But only provides 15 bytes
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(content);
    });

    it("handles responses without content-length header", async () => {
      const content = "Content without length header";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]), // No content-length
        arrayBuffer: () => {
          const buffer = Buffer.from(content, "utf-8");
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
      expect(data.text).toBe(content);
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("handles files at exactly common size boundaries", async () => {
      const testSizes = [
        1024, // 1KB
        1024 * 1024, // 1MB
        2 * 1024 * 1024, // 2MB
        5 * 1024 * 1024, // 5MB
      ];

      for (const size of testSizes) {
        const content = "x".repeat(size);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          headers: new Headers([
            ["content-type", "text/plain"],
            ["content-length", size.toString()],
          ]),
          arrayBuffer: () => {
            const buffer = Buffer.from(content, "utf-8");
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
        expect(data.text.length).toBe(size);

        jest.clearAllMocks();
      }
    });

    it("handles streaming vs. buffered content appropriately", async () => {
      const streamContent = "Streamed content";

      // Mock fetch to simulate streaming response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          // Simulate some processing time for buffering
          return new Promise((resolve) =>
            setTimeout(() => {
              const buffer = Buffer.from(streamContent, "utf-8");
              resolve(
                buffer.buffer.slice(
                  buffer.byteOffset,
                  buffer.byteOffset + buffer.byteLength
                )
              );
            }, 50)
          );
        },
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(streamContent);
    });

    it("handles binary data that exceeds text processing limits", async () => {
      // Create large binary data that's not text or PDF
      const largeBinaryData = new Uint8Array(5 * 1024 * 1024); // 5MB of binary data
      largeBinaryData.fill(0xff); // Fill with non-text bytes

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "application/octet-stream"]]),
        arrayBuffer: () => Promise.resolve(largeBinaryData.buffer),
      });

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      // Binary data will be processed as text (may be garbled)
      expect(typeof data.text).toBe("string");
      expect(data.text.length).toBeGreaterThan(0);
    });
  });

  describe("Resource cleanup and garbage collection", () => {
    it("properly releases memory after processing large files", async () => {
      const largeContent = "x".repeat(10 * 1024 * 1024); // 10MB

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(largeContent, "utf-8");
          return Promise.resolve(
            buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength
            )
          );
        },
      });

      const initialMemory = process.memoryUsage();

      const response = await POST(createValidRequest());
      const data = await response.json();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();

      expect(response.status).toBe(200);
      expect(data.text.length).toBe(10 * 1024 * 1024);

      // Memory should not increase excessively (this is a loose check)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it("handles multiple sequential large file requests without memory leaks", async () => {
      const mediumContent = "x".repeat(1024 * 1024); // 1MB each

      const initialMemory = process.memoryUsage();

      // Process 5 files sequentially
      for (let i = 0; i < 5; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          headers: new Headers([["content-type", "text/plain"]]),
          arrayBuffer: () => {
            const buffer = Buffer.from(mediumContent, "utf-8");
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
        expect(data.text.length).toBe(1024 * 1024);

        jest.clearAllMocks();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory should not accumulate significantly
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB total increase
    });
  });
});
