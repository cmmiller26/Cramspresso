/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/sets/[setId]/cards/route";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Mock types that match expected API return types
type MockUser = {
  id: string;
  clerkId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type MockFlashcardSet = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

// Mock the modules
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    flashcardSet: {
      findFirst: jest.fn(),
    },
    flashcard: {
      createMany: jest.fn(),
    },
  },
}));

// Create properly typed mock functions
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = {
  user: {
    findUnique: prisma.user.findUnique as jest.MockedFunction<
      typeof prisma.user.findUnique
    >,
  },
  flashcardSet: {
    findFirst: prisma.flashcardSet.findFirst as jest.MockedFunction<
      typeof prisma.flashcardSet.findFirst
    >,
  },
  flashcard: {
    createMany: prisma.flashcard.createMany as jest.MockedFunction<
      typeof prisma.flashcard.createMany
    >,
  },
};

// Replace the actual prisma calls
Object.assign(prisma, mockPrisma);

describe("API Route /api/sets/[setId]/cards - Add cards to set", () => {
  const mockUser: MockUser = {
    id: "user_test_123",
    clerkId: "clerk_test_user_123",
    email: "john+clerk_test@example.com",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  const mockSet: MockFlashcardSet = {
    id: "set_test_123",
    name: "Test Set",
    userId: "user_test_123",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  const mockParams = Promise.resolve({ setId: "set_test_123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createValidRequest = (body: object) =>
    new NextRequest("http://localhost/api/sets/set_test_123/cards", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  describe("POST /api/sets/[setId]/cards", () => {
    it("successfully adds multiple cards to existing set", async () => {
      const requestBody = {
        cards: [
          { question: "What is 2+2?", answer: "4" },
          { question: "What is 3+3?", answer: "6" },
          { question: "What is 4+4?", answer: "8" },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockResolvedValue({ count: 3 });

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inserted).toBe(3);
      expect(mockPrisma.flashcard.createMany).toHaveBeenCalledWith({
        data: [
          { question: "What is 2+2?", answer: "4", setId: "set_test_123" },
          { question: "What is 3+3?", answer: "6", setId: "set_test_123" },
          { question: "What is 4+4?", answer: "8", setId: "set_test_123" },
        ],
        skipDuplicates: true,
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when user not found in database", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcardSet.findFirst).not.toHaveBeenCalled();
    });

    it("returns 404 when set not found", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
      expect(mockPrisma.flashcard.createMany).not.toHaveBeenCalled();
    });

    it("returns 404 when user tries to add cards to another user's set", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      const otherUser = {
        ...mockUser,
        id: "other_user_test_123",
        clerkId: "clerk_test_other_user",
      };
      mockAuth.mockResolvedValue({ userId: "clerk_test_other_user" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(otherUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "other_user_test_123" },
      });
    });

    it("returns 400 for invalid cards data - not an array", async () => {
      const requestBody = {
        cards: "not an array",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid cards data");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid cards data - empty array", async () => {
      const requestBody = {
        cards: [],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid cards data");
    });

    it("returns 400 for invalid card format - missing question", async () => {
      const requestBody = {
        cards: [{ answer: "Test answer" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("returns 400 for invalid card format - missing answer", async () => {
      const requestBody = {
        cards: [{ question: "Test question" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("returns 400 for invalid card format at specific index", async () => {
      const requestBody = {
        cards: [
          { question: "Valid question", answer: "Valid answer" },
          { question: "Invalid", answer: 123 },
          { question: "Another valid", answer: "Another answer" },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 1");
    });

    it("returns 400 for cards with non-string question", async () => {
      const requestBody = {
        cards: [{ question: 123, answer: "Valid answer" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("returns 400 for cards with non-string answer", async () => {
      const requestBody = {
        cards: [{ question: "Valid question", answer: null }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("successfully handles skipDuplicates behavior", async () => {
      const requestBody = {
        cards: [
          { question: "Unique question", answer: "Unique answer" },
          { question: "Duplicate question", answer: "Duplicate answer" },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockResolvedValue({ count: 1 });

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inserted).toBe(1);
      expect(mockPrisma.flashcard.createMany).toHaveBeenCalledWith({
        data: [
          {
            question: "Unique question",
            answer: "Unique answer",
            setId: "set_test_123",
          },
          {
            question: "Duplicate question",
            answer: "Duplicate answer",
            setId: "set_test_123",
          },
        ],
        skipDuplicates: true,
      });
    });

    it("returns 500 for database errors", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockRejectedValue(
        new Error("Database error")
      );

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("handles unknown database errors", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockRejectedValue("Unknown error");

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown error");
    });

    it("adds setId to each card correctly", async () => {
      const requestBody = {
        cards: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockResolvedValue({ count: 2 });

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcard.createMany).toHaveBeenCalledWith({
        data: [
          { question: "Q1", answer: "A1", setId: "set_test_123" },
          { question: "Q2", answer: "A2", setId: "set_test_123" },
        ],
        skipDuplicates: true,
      });
    });

    it("verifies set ownership before adding cards", async () => {
      const requestBody = {
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockResolvedValue({ count: 1 });

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "user_test_123" },
      });
    });

    it("handles large batch of cards", async () => {
      const largeCardBatch = Array.from({ length: 100 }, (_, i) => ({
        question: `Question ${i + 1}`,
        answer: `Answer ${i + 1}`,
      }));

      const requestBody = { cards: largeCardBatch };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findFirst.mockResolvedValue(mockSet as any);
      mockPrisma.flashcard.createMany.mockResolvedValue({ count: 100 });

      const response = await POST(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inserted).toBe(100);
      expect(mockPrisma.flashcard.createMany).toHaveBeenCalledWith({
        data: largeCardBatch.map((card) => ({
          ...card,
          setId: "set_test_123",
        })),
        skipDuplicates: true,
      });
    });
  });
});
