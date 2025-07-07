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

describe("API Route /api/flashcards/extract-text - Network Fetch", () => {
  const createValidRequest = (url: string = "https://example.com/test.pdf") =>
    new NextRequest("http://localhost/api/flashcards/extract-text", {
      method: "POST",
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful fetch operations", () => {
    it("successfully fetches content from a valid URL", async () => {
      const testText = "Sample text content";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/test.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/test.txt");
      expect(data.text).toBe(testText);
    });

    it("handles redirects automatically", async () => {
      const testText = "Redirected content";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/redirect"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
    });

    it("handles different content types correctly", async () => {
      const testText = "test content";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/content.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/content.txt");
      expect(data.text).toBe(testText);
    });

    it("handles missing content-type header", async () => {
      const testText = "Content without type";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/no-type.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/no-type.txt");
      expect(data.text).toBe(testText);
    });
  });

  describe("HTTP error responses", () => {
    it("returns 502 when fetch returns 404", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe("Failed to fetch file: 404");
    });

    it("returns 502 when fetch returns 403", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe("Failed to fetch file: 403");
    });

    it("returns 502 when fetch returns 500", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe("Failed to fetch file: 500");
    });

    it("returns 502 when fetch returns 401", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe("Failed to fetch file: 401");
    });
  });

  describe("Network failures", () => {
    it("returns 500 when network connection fails", async () => {
      const networkError = new Error("Network connection failed");
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Network connection failed");
    });

    it("returns 500 when DNS resolution fails", async () => {
      const dnsError = new Error("getaddrinfo ENOTFOUND invalid-domain.com");
      (global.fetch as jest.Mock).mockRejectedValueOnce(dnsError);

      const response = await POST(createValidRequest("https://invalid-domain.com/test.pdf"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("getaddrinfo ENOTFOUND invalid-domain.com");
    });

    it("returns 500 when connection is refused", async () => {
      const connectionError = new Error("connect ECONNREFUSED");
      (global.fetch as jest.Mock).mockRejectedValueOnce(connectionError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("connect ECONNREFUSED");
    });

    it("returns 500 when connection times out", async () => {
      const timeoutError = new Error("Request timeout");
      (global.fetch as jest.Mock).mockRejectedValueOnce(timeoutError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Request timeout");
    });

    it("handles unknown network errors gracefully", async () => {
      const unknownError = new Error("Unknown network error");
      (global.fetch as jest.Mock).mockRejectedValueOnce(unknownError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown network error");
    });

    it("handles non-Error objects thrown by fetch", async () => {
      const stringError = "String error message";
      (global.fetch as jest.Mock).mockRejectedValueOnce(stringError);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("String error message");
    });

    it("handles null/undefined errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(null);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown error");
    });
  });

  describe("Edge cases and boundary conditions", () => {
    it("handles empty response body", async () => {
      const testText = "";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/empty.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/empty.txt");
      expect(data.text).toBe(testText);
    });

    it("handles very large response bodies gracefully", async () => {
      // Simulate a large text file (1MB)
      const testText = "a".repeat(1024 * 1024);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/large.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/large.txt");
      expect(data.text).toBe(testText);
    });

    it("handles binary content that's not PDF", async () => {
      // Simulate binary data (like an image) 
      const testText = String.fromCharCode(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A); // PNG header as string
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "image/png"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "binary");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/image.png"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/image.png");
      // Binary data should be treated as text (may result in garbled output)
      expect(typeof data.text).toBe("string");
    });

    it("handles URLs with query parameters", async () => {
      const url = "https://example.com/file.pdf?version=1&token=abc123";
      const testText = "Content with query params";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest(url));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith(url);
    });

    it("handles URLs with fragments", async () => {
      const url = "https://example.com/file.pdf#section1";
      const testText = "Content with fragment";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest(url));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toBe(testText);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith(url);
    });
  });

  describe("Response processing", () => {
    it("correctly processes arrayBuffer response", async () => {
      const testText = "Test content for arrayBuffer";
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => {
          const buffer = Buffer.from(testText, "utf-8");
          return Promise.resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest("https://example.com/arraybuffer.txt"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect((global.fetch as jest.Mock)).toHaveBeenCalledWith("https://example.com/arraybuffer.txt");
      expect(data.text).toBe(testText);
    });

    it("handles arrayBuffer conversion errors", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers([["content-type", "text/plain"]]),
        arrayBuffer: () => Promise.reject(new Error("Failed to read response body")),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await POST(createValidRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to read response body");
    });
  });
});