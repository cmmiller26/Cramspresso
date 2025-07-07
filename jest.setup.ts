import "@testing-library/jest-dom";

// Mock fetch for API tests
global.fetch = jest.fn();

// Add Web API polyfills for Next.js API route testing
global.Request =
  global.Request ||
  class Request {
    constructor(public url: string, public init?: RequestInit) {}
    json() {
      return Promise.resolve({});
    }
    text() {
      return Promise.resolve("");
    }
    headers = new Map();
  };

global.Response =
  global.Response ||
  class Response {
    constructor(public body?: string, public init?: ResponseInit) {}
    static json(data: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
      });
    }
    json() {
      return Promise.resolve(this.body ? JSON.parse(this.body) : {});
    }
    text() {
      return Promise.resolve(this.body || "");
    }
    ok = true;
    status = 200;
    headers = new Map();
  };

// Mock Headers to behave like the real Headers API
global.Headers = global.Headers || class Headers {
  private headers: Map<string, string>;
  
  constructor(init?: HeadersInit) {
    this.headers = new Map();
    if (init) {
      if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this.headers.set(key.toLowerCase(), value));
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.headers.set(key.toLowerCase(), value);
        }
      }
    }
  }
  
  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }
  
  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }
  
  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }
  
  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }
  
  forEach(callback: (value: string, key: string, headers: Headers) => void): void {
    this.headers.forEach((value, key) => callback(value, key, this));
  }
  
  *[Symbol.iterator](): IterableIterator<[string, string]> {
    yield* this.headers.entries();
  }
};

// Mock OpenAI module
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});
