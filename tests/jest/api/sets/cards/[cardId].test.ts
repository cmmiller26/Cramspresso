/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "@/app/api/sets/[setId]/cards/[cardId]/route";
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

type MockFlashcard = {
  id: string;
  question: string;
  answer: string;
  setId: string;
  createdAt: string;
  updatedAt: string;
  set: {
    id: string;
    userId: string;
    name: string;
  };
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
    flashcard: {
      findUnique: jest.fn(),
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
  flashcard: {
    findUnique: prisma.flashcard.findUnique as jest.MockedFunction<
      typeof prisma.flashcard.findUnique
    >,
    update: prisma.flashcard.update as jest.MockedFunction<
      typeof prisma.flashcard.update
    >,
    delete: prisma.flashcard.delete as jest.MockedFunction<
      typeof prisma.flashcard.delete
    >,
  },
};

// Replace the actual prisma calls
Object.assign(prisma, mockPrisma);

describe("API Route /api/sets/[setId]/cards/[cardId] - Individual card operations", () => {
  const mockUser: MockUser = {
    id: "user_test_123",
    clerkId: "clerk_test_user_123",
    email: "john+clerk_test@example.com",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  };

  const mockCard: MockFlashcard = {
    id: "card_test_123",
    question: "What is 2+2?",
    answer: "4",
    setId: "set_test_123",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
    set: {
      id: "set_test_123",
      userId: "user_test_123",
      name: "Test Set",
    },
  };

  const mockParams = Promise.resolve({
    setId: "set_test_123",
    cardId: "card_test_123",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PATCH /api/sets/[setId]/cards/[cardId]", () => {
    const createValidRequest = (body: object) =>
      new NextRequest(
        "http://localhost/api/sets/set_test_123/cards/card_test_123",
        {
          method: "PATCH",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );

    it("successfully updates card question and answer", async () => {
      const requestBody = {
        question: "What is 5+5?",
        answer: "10",
      };

      const updatedCard = {
        ...mockCard,
        question: "What is 5+5?",
        answer: "10",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.update.mockResolvedValue(updatedCard as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Card updated successfully");
      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: "card_test_123" },
        data: { question: "What is 5+5?", answer: "10" },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

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
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcard.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid question - empty string", async () => {
      const requestBody = {
        question: "",
        answer: "Valid answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid question - only whitespace", async () => {
      const requestBody = {
        question: "   ",
        answer: "Valid answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 400 for invalid question - not a string", async () => {
      const requestBody = {
        question: 123,
        answer: "Valid answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 400 for invalid answer - empty string", async () => {
      const requestBody = {
        question: "Valid question",
        answer: "",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 400 for invalid answer - only whitespace", async () => {
      const requestBody = {
        question: "Valid question",
        answer: "   ",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 400 for invalid answer - not a string", async () => {
      const requestBody = {
        question: "Valid question",
        answer: null,
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 404 when card not found", async () => {
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcard.findUnique.mockResolvedValue(null);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Card not found");
      expect(mockPrisma.flashcard.update).not.toHaveBeenCalled();
    });

    it("returns 404 when card belongs to different user's set", async () => {
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcard.findUnique.mockResolvedValue(null);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Card not found");
      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: {
          id: "card_test_123",
          set: { id: "set_test_123", userId: "user_test_123" },
        },
      });
    });

    it("returns 500 for database errors during update", async () => {
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);
      mockPrisma.flashcard.update.mockRejectedValue(
        new Error("Database error")
      );

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update card in set");
    });

    it("verifies card ownership before update", async () => {
      const requestBody = {
        question: "Updated question",
        answer: "Updated answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.update.mockResolvedValue({
        ...mockCard,
        question: "Updated question",
        answer: "Updated answer",
      } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: {
          id: "card_test_123",
          set: { id: "set_test_123", userId: "user_test_123" },
        },
      });
    });

    it("preserves card properties during update", async () => {
      const requestBody = {
        question: "New question",
        answer: "New answer",
      };

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.update.mockResolvedValue({
        ...mockCard,
        question: "New question",
        answer: "New answer",
      } as any);

      const response = await PATCH(createValidRequest(requestBody), {
        params: mockParams,
      });

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcard.update).toHaveBeenCalledWith({
        where: { id: "card_test_123" },
        data: { question: "New question", answer: "New answer" },
      });
    });
  });

  describe("DELETE /api/sets/[setId]/cards/[cardId]", () => {
    it("successfully deletes card", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.delete.mockResolvedValue(mockCard as any);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Card deleted successfully");
      expect(mockPrisma.flashcard.delete).toHaveBeenCalledWith({
        where: { id: "card_test_123" },
      });
    });

    it("returns 401 for unauthenticated requests", async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
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
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
      expect(mockPrisma.flashcard.findUnique).not.toHaveBeenCalled();
    });

    it("returns 404 when card not found", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcard.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Card not found");
      expect(mockPrisma.flashcard.delete).not.toHaveBeenCalled();
    });

    it("returns 404 when card belongs to different user's set", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcard.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Card not found");
      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: {
          id: "card_test_123",
          set: { id: "set_test_123", userId: "user_test_123" },
        },
      });
    });

    it("returns 500 for database errors during deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);
      mockPrisma.flashcard.delete.mockRejectedValue(
        new Error("Database error")
      );

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete card from set");
    });

    it("verifies card ownership before deletion", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.delete.mockResolvedValue(mockCard as any);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: {
          id: "card_test_123",
          set: { id: "set_test_123", userId: "user_test_123" },
        },
      });
    });

    it("successfully removes card from set without affecting other cards", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);

      mockPrisma.flashcard.delete.mockResolvedValue(mockCard as any);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      expect(mockPrisma.flashcard.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.flashcard.delete).toHaveBeenCalledWith({
        where: { id: "card_test_123" },
      });
    });

    it("handles deletion with proper error messages", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);
      mockPrisma.flashcard.delete.mockRejectedValue("Unknown error");

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/set_test_123/cards/card_test_123"
        ),
        { params: mockParams }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete card from set");
    });

    it("validates setId and cardId parameters", async () => {
      const customParams = Promise.resolve({
        setId: "different_set_test_123",
        cardId: "card_test_123",
      });

      mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.flashcard.findUnique.mockResolvedValue(null);

      const response = await DELETE(
        new NextRequest(
          "http://localhost/api/sets/different_set_test_123/cards/card_test_123"
        ),
        { params: customParams }
      );

      expect(response.status).toBe(404);
      expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
        where: {
          id: "card_test_123",
          set: { id: "different_set_test_123", userId: "user_test_123" },
        },
      });
    });
  });
});
