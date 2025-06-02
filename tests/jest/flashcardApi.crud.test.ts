import {
  appendCardsToSet,
  createSetWithCards,
  deleteCardFromSet,
  deleteSet,
  updateCardInSet,
  updateSetName,
} from "@/lib/flashcardApi";

describe("Flashcard API - CRUD endpoints (parameterized)", () => {
  const fakeSetId = "set123";
  const fakeCardId = "card456";
  const fakeCards = [{ question: "Q1", answer: "A1" }];

  type EndpointTest = {
    description: string;
    fn: (...args: any[]) => Promise<any>;
    args: any[];
    expectedUrl: string;
    expectedMethod: "POST" | "PATCH" | "DELETE";
    expectedBody?: any;
    expectedErrorMsg?: string;
  };

  const tests: EndpointTest[] = [
    {
      description: "createSetWithCards -> POST /api/sets",
      fn: createSetWithCards,
      args: ["My Set", fakeCards],
      expectedUrl: "/api/sets",
      expectedMethod: "POST",
      expectedBody: {
        name: "My Set",
        cards: fakeCards,
      },
      expectedErrorMsg: "Failed to create set",
    },
    {
      description: "appendCardToSet -> PATCH /api/sets/:setId/cards",
      fn: appendCardsToSet,
      args: [fakeSetId, fakeCards],
      expectedUrl: `/api/sets/${fakeSetId}/cards`,
      expectedMethod: "POST",
      expectedBody: {
        cards: fakeCards,
      },
      expectedErrorMsg: "Failed to append cards to set",
    },
    {
      description: "updateCardInSet -> PATCH /api/sets/:setId/cards/:cardId",
      fn: updateCardInSet,
      args: [fakeSetId, fakeCardId, { question: "NewQ", answer: "NewA" }],
      expectedUrl: `/api/sets/${fakeSetId}/cards/${fakeCardId}`,
      expectedMethod: "PATCH",
      expectedBody: {
        question: "NewQ",
        answer: "NewA",
      },
      expectedErrorMsg: "Failed to update card in set",
    },
    {
      description: "deleteCardFromSet -> DELETE /api/sets/:setId/cards/:cardId",
      fn: deleteCardFromSet,
      args: [fakeSetId, fakeCardId],
      expectedUrl: `/api/sets/${fakeSetId}/cards/${fakeCardId}`,
      expectedMethod: "DELETE",
      expectedBody: null,
      expectedErrorMsg: "Failed to delete card from set",
    },
    {
      description: "updateSetName -> PATCH /api/sets/:setId",
      fn: updateSetName,
      args: [fakeSetId, "New Set Name"],
      expectedUrl: `/api/sets/${fakeSetId}`,
      expectedMethod: "PATCH",
      expectedBody: {
        name: "New Set Name",
      },
      expectedErrorMsg: "Failed to update set name",
    },
    {
      description: "deleteSet -> DELETE /api/sets/:setId",
      fn: deleteSet,
      args: [fakeSetId],
      expectedUrl: `/api/sets/${fakeSetId}`,
      expectedMethod: "DELETE",
      expectedBody: null,
      expectedErrorMsg: "Failed to delete set",
    },
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it.each(tests)(
    "$description (ok: true) -> resolves and sends correct request",
    async ({ fn, args, expectedUrl, expectedMethod, expectedBody }) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "NEW_ID" }),
      });

      const result = await fn(...args);

      if (fn === createSetWithCards) {
        expect(result).toEqual({ setId: "NEW_ID" });
      } else {
        expect(result).toBeUndefined();
      }

      if (expectedBody !== null) {
        expect(global.fetch).toHaveBeenCalledWith(
          expectedUrl,
          expect.objectContaining({
            method: expectedMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expectedBody),
          })
        );
      } else {
        expect(global.fetch).toHaveBeenCalledWith(
          expectedUrl,
          expect.objectContaining({
            method: expectedMethod,
          })
        );
      }
    }
  );

  it.each(tests)(
    "$description (ok: false) -> rejects with `$expectedErrorMsg`",
    async ({ fn, args, expectedErrorMsg }) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });
      await expect(fn(...args)).rejects.toThrow(expectedErrorMsg);
    }
  );
});
