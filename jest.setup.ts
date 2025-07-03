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

global.Headers = global.Headers || Map;

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
