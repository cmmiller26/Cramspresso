import {
  appendCardsToSet,
  createSetWithCards,
  deleteCardFromSet,
  deleteSet,
  generateFromUrls,
  updateCardInSet,
  updateSetName,
} from "@/lib/flashcardApi";

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

describe("Flashcard API - basic generateUrls + CRUD happy/failure paths", () => {
  const fakeUrl = "http://example.com";

  const fakeSetId = "set123";
  const fakeCardId = "card456";

  const fakeText = "Q: What is the capital of France? A: Paris";
  const fakeCards = [
    { question: "What is the capital of France?", answer: "Paris" },
  ];

  describe("generateFromUrls", () => {
    it("extracts text from URLs and generates flashcards", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ text: fakeText }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ cards: fakeCards }),
        });

      const result = await generateFromUrls([fakeUrl]);
      expect(result).toEqual(fakeCards);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        "/api/flashcards/extract-text",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fakeUrl }),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/flashcards/generate",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fakeText }),
        })
      );
    });

    it("throws an error if text extraction fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });
      await expect(generateFromUrls([fakeUrl])).rejects.toThrow(
        "Failed to extract text"
      );
    });
  });

  describe("createSetWithCards", () => {
    const fakeId = "set123";

    it("returns set ID on successful creation", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: fakeId }),
      });

      await expect(createSetWithCards("Test Set", [])).resolves.toEqual({
        setId: fakeId,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sets",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test Set", cards: [] }),
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });
      await expect(createSetWithCards("Test Set", [])).rejects.toThrow(
        "Failed to create set"
      );
    });
  });

  describe("appendCardsToSet", () => {
    it("resolves on successful append", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(
        appendCardsToSet(fakeSetId, fakeCards)
      ).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sets/${fakeSetId}/cards`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cards: fakeCards }),
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(appendCardsToSet(fakeSetId, fakeCards)).rejects.toThrow(
        "Failed to append cards"
      );
    });
  });

  describe("updateCardInSet", () => {
    const fakeUpdates = {
      question: "Updated Question",
      answer: "Updated Answer",
    };

    it("resolves on successful update", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(
        updateCardInSet(fakeSetId, fakeCardId, fakeUpdates)
      ).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sets/${fakeSetId}/cards/${fakeCardId}`,
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fakeUpdates),
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(
        updateCardInSet(fakeSetId, fakeCardId, fakeUpdates)
      ).rejects.toThrow("Failed to update card");
    });
  });

  describe("deleteCardFromSet", () => {
    it("resolves on successful deletion", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(
        deleteCardFromSet(fakeSetId, fakeCardId)
      ).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sets/${fakeSetId}/cards/${fakeCardId}`,
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(deleteCardFromSet(fakeSetId, fakeCardId)).rejects.toThrow(
        "Failed to delete card"
      );
    });
  });

  describe("updateSetName", () => {
    const fakeName = "Updated Set Name";

    it("resolves on successful update", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(updateSetName(fakeSetId, fakeName)).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sets/${fakeSetId}`,
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fakeName }),
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(updateSetName(fakeSetId, fakeName)).rejects.toThrow(
        "Failed to update set name"
      );
    });
  });

  describe("deleteSet", () => {
    it("resolves on successful deletion", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await expect(deleteSet(fakeSetId)).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sets/${fakeSetId}`,
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("throws an error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(deleteSet(fakeSetId)).rejects.toThrow(
        "Failed to delete set"
      );
    });
  });
});
