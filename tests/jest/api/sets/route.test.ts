/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/sets/route";
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
  _count?: { cards: number };
  cards?: MockFlashcard[];
};

type MockFlashcard = {
  id: string;
  question: string;
  answer: string;
  setId: string;
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
      findMany: jest.fn(),
      create: jest.fn(),
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
    findMany: prisma.flashcardSet.findMany as jest.MockedFunction<
      typeof prisma.flashcardSet.findMany
    >,
    create: prisma.flashcardSet.create as jest.MockedFunction<
      typeof prisma.flashcardSet.create
    >,
  },
};

// Replace the actual prisma calls
Object.assign(prisma, mockPrisma);

describe("API Route /api/sets - GET and POST operations", () => {
  const mockUser: MockUser = {
    id: "user_test_123",
    clerkId: "clerk_test_user_123",
    email: "john+clerk_test@example.com",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  const mockSets: MockFlashcardSet[] = [
    {
      id: "set-1",
      name: "Math Quiz",
      userId: "user_test_123",
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
      _count: { cards: 5 },
    },
    {
      id: "set-2",
      name: "Science Quiz",
      userId: "user_test_123",
      createdAt: "2023-01-02T00:00:00.000Z",
      updatedAt: "2023-01-02T00:00:00.000Z",
      _count: { cards: 3 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/sets", () => {
    it("successfully fetches user's sets with card counts", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcardSet.findMany.mockResolvedValue(mockSets as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSets);
      expect(mockPrisma.flashcardSet.findMany).toHaveBeenCalledWith({
        where: { userId: "user_test_123" },
        include: { _count: { select: { cards: true } } },
        orderBy: { createdAt: "desc" },
      });
    });

    it("returns empty array for new users with no sets", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when user not found in database", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcardSet.findMany).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/sets", () => {
    const createValidRequest = (body: object) =>
      new NextRequest("http://localhost/api/sets", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

    const mockCreatedSet: MockFlashcardSet = {
      id: "set-new",
      name: "New Test Set",
      userId: "user_test_123",
      createdAt: "2023-01-03T00:00:00.000Z",
      updatedAt: "2023-01-03T00:00:00.000Z",
      cards: [
        {
          id: "card-1",
          question: "What is 2+2?",
          answer: "4",
          setId: "set-new",
          createdAt: "2023-01-03T00:00:00.000Z",
          updatedAt: "2023-01-03T00:00:00.000Z",
        },
      ],
    };

    it("successfully creates set with valid cards", async () => {
      const requestBody = {
        name: "New Test Set",
        cards: [{ question: "What is 2+2?", answer: "4" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.flashcardSet.create.mockResolvedValue(mockCreatedSet as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedSet);
      expect(mockPrisma.flashcardSet.create).toHaveBeenCalledWith({
        data: {
          name: "New Test Set",
          user: {
            connectOrCreate: {
              where: { clerkId: "clerk_test_user_123" },
              create: { clerkId: "clerk_test_user_123" },
            },
          },
          cards: {
            create: [{ question: "What is 2+2?", answer: "4" }],
          },
        },
        include: { cards: true },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.flashcardSet.create).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid set name - empty string", async () => {
      const requestBody = {
        name: "",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
    });

    it("returns 400 for invalid set name - only whitespace", async () => {
      const requestBody = {
        name: "   ",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
    });

    it("returns 400 for invalid set name - not a string", async () => {
      const requestBody = {
        name: 123,
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
    });

    it("returns 400 for invalid cards data - not an array", async () => {
      const requestBody = {
        name: "Test Set",
        cards: "not an array",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid cards data");
    });

    it("returns 400 for invalid card format - missing question", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [{ answer: "Test answer" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("returns 400 for invalid card format - missing answer", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [{ question: "Test question" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 0");
    });

    it("returns 400 for invalid card format at specific index", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [
          { question: "Valid question", answer: "Valid answer" },
          { question: "Invalid", answer: 123 },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid card format at index 1");
    });

    it("handles database constraint violations", async () => {
      const requestBody = {
        name: "Duplicate Set",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.flashcardSet.create.mockRejectedValue(
        new Error("Unique constraint failed")
      );

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unique constraint failed");
    });

    it("handles unknown database errors", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.flashcardSet.create.mockRejectedValue("Unknown error");

      const response = await POST(createValidRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Unknown error");
    });

    it("trims whitespace from set name", async () => {
      const requestBody = {
        name: "  Trimmed Set Name  ",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.flashcardSet.create.mockResolvedValue(mockCreatedSet as any);

      const response = await POST(createValidRequest(requestBody));

      expect(response.status).toBe(201);
      expect(mockPrisma.flashcardSet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Trimmed Set Name",
          }),
        })
      );
    });

    it("uses connectOrCreate for user relationship", async () => {
      const requestBody = {
        name: "Test Set",
        cards: [{ question: "Test?", answer: "Test" }],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_new_user" } as any);

      mockPrisma.flashcardSet.create.mockResolvedValue(mockCreatedSet as any);

      const response = await POST(createValidRequest(requestBody));

      expect(response.status).toBe(201);
      expect(mockPrisma.flashcardSet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: {
              connectOrCreate: {
                where: { clerkId: "clerk_test_new_user" },
                create: { clerkId: "clerk_test_new_user" },
              },
            },
          }),
        })
      );
    });

    it("creates multiple cards correctly", async () => {
      const requestBody = {
        name: "Multi-Card Set",
        cards: [
          { question: "Q1", answer: "A1" },
          { question: "Q2", answer: "A2" },
          { question: "Q3", answer: "A3" },
        ],
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.flashcardSet.create.mockResolvedValue({
        ...mockCreatedSet,
        cards: [
          {
            id: "card-1",
            question: "Q1",
            answer: "A1",
            setId: "set-new",
            createdAt: "2023-01-03T00:00:00.000Z",
            updatedAt: "2023-01-03T00:00:00.000Z",
          },
          {
            id: "card-2",
            question: "Q2",
            answer: "A2",
            setId: "set-new",
            createdAt: "2023-01-03T00:00:00.000Z",
            updatedAt: "2023-01-03T00:00:00.000Z",
          },
          {
            id: "card-3",
            question: "Q3",
            answer: "A3",
            setId: "set-new",
            createdAt: "2023-01-03T00:00:00.000Z",
            updatedAt: "2023-01-03T00:00:00.000Z",
          },
        ],
      } as any);

      const response = await POST(createValidRequest(requestBody));

      expect(response.status).toBe(201);
      expect(mockPrisma.flashcardSet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cards: {
              create: [
                { question: "Q1", answer: "A1" },
                { question: "Q2", answer: "A2" },
                { question: "Q3", answer: "A3" },
              ],
            },
          }),
        })
      );
    });
  });
});
