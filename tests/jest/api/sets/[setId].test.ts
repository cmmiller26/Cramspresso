/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/sets/[setId]/route";
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
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
    update: prisma.flashcardSet.update as jest.MockedFunction<
      typeof prisma.flashcardSet.update
    >,
    delete: prisma.flashcardSet.delete as jest.MockedFunction<
      typeof prisma.flashcardSet.delete
    >,
  },
};

// Replace the actual prisma calls
Object.assign(prisma, mockPrisma);

describe("API Route /api/sets/[setId] - Individual set operations", () => {
  const mockUser: MockUser = {
    id: "user_test_123",
    clerkId: "clerk_test_user_123",
    email: "john+clerk_test@example.com",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  const mockSetWithCards: MockFlashcardSet = {
    id: "set_test_123",
    name: "Test Set",
    userId: "user_test_123",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
    cards: [
      {
        id: "card-1",
        question: "What is 2+2?",
        answer: "4",
        setId: "set_test_123",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      },
      {
        id: "card-2",
        question: "What is 3+3?",
        answer: "6",
        setId: "set_test_123",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      },
    ],
  };

  const mockParams = Promise.resolve({ setId: "set_test_123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/sets/[setId]", () => {
    it("successfully fetches set with cards for owner", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(
        mockSetWithCards as any
      );

      const response = await GET(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSetWithCards);
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "user_test_123" },
        include: { cards: true },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await GET(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when user not found in database", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcardSet.findFirst).not.toHaveBeenCalled();
    });

    it("returns 404 when set not found", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await GET(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
    });

    it("returns 404 when user tries to access another user's set", async () => {
      const otherUser = {
        ...mockUser,
        id: "other_user_test_123",
        clerkId: "clerk_test_other_user",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_other_user" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(otherUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await GET(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "other_user_test_123" },
        include: { cards: true },
      });
    });
  });

  describe("PATCH /api/sets/[setId]", () => {
    const createValidRequest = (body: object) =>
      new NextRequest("http://localhost/api/sets/set_test_123", {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

    it("successfully updates set name", async () => {
      const requestBody = { name: "Updated Set Name" };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.update.mockResolvedValue({
        ...mockSetWithCards,
        name: "Updated Set Name",
      } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Set name updated successfully");
      expect(mockPrisma.flashcardSet.update).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "user_test_123" },
        data: { name: "Updated Set Name" },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      const requestBody = { name: "Updated Name" };

      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when user not found in database", async () => {
      const requestBody = { name: "Updated Name" };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcardSet.update).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid set name - empty string", async () => {
      const requestBody = { name: "" };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid set name - only whitespace", async () => {
      const requestBody = { name: "   " };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
    });

    it("returns 400 for invalid set name - not a string", async () => {
      const requestBody = { name: 123 };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid set name");
    });

    it("returns 500 for database errors", async () => {
      const requestBody = { name: "Updated Name" };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.update.mockRejectedValue(
        new Error("Database error")
      );

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("handles unknown database errors", async () => {
      const requestBody = { name: "Updated Name" };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.update.mockRejectedValue("Unknown error");

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown error");
    });

    it("trims whitespace from updated name", async () => {
      const requestBody = { name: "  Trimmed Name  " };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.update.mockResolvedValue({
        ...mockSetWithCards,
        name: "Trimmed Name",
      } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcardSet.update).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "user_test_123" },
        data: { name: "  Trimmed Name  " },
      });
    });
  });

  describe("DELETE /api/sets/[setId]", () => {
    it("successfully deletes set with cascade", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(
        mockSetWithCards as any
      );

      mockPrisma.flashcardSet.delete.mockResolvedValue(mockSetWithCards as any);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Set deleted successfully");
      expect(mockPrisma.flashcardSet.delete).toHaveBeenCalledWith({
        where: { id: "set_test_123" },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Not authenticated");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when user not found in database", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcardSet.findFirst).not.toHaveBeenCalled();
    });

    it("returns 404 when set not found for deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
      expect(mockPrisma.flashcardSet.delete).not.toHaveBeenCalled();
    });

    it("returns 404 when user tries to delete another user's set", async () => {
      const otherUser = {
        ...mockUser,
        id: "other_user_test_123",
        clerkId: "clerk_test_other_user",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_other_user" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(otherUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Set not found");
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "other_user_test_123" },
      });
    });

    it("returns 500 for database errors during deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(
        mockSetWithCards as any
      );
      mockPrisma.flashcardSet.delete.mockRejectedValue(
        new Error("Database error")
      );

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });

    it("handles unknown database errors during deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(
        mockSetWithCards as any
      );
      mockPrisma.flashcardSet.delete.mockRejectedValue("Unknown error");

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unknown error");
    });

    it("verifies set ownership before deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcardSet.findFirst.mockResolvedValue(
        mockSetWithCards as any
      );

      mockPrisma.flashcardSet.delete.mockResolvedValue(mockSetWithCards as any);

      const response = await DELETE(
        new NextRequest("http://localhost/api/sets/set_test_123"),
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcardSet.findFirst).toHaveBeenCalledWith({
        where: { id: "set_test_123", userId: "user_test_123" },
      });
    });
  });
});
