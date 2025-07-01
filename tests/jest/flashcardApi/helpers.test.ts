import { extractText, generateCards } from "@/lib/flashcardApi";

describe("extractText helper - payload and JSON shape validation", () => {
  const fakeUrl = "https://example.com";

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("sends a POST request with the correct payload", async () => {
    const fakeResponse = "Sample extracted text";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ text: fakeResponse }),
    });

    const payload = await extractText(fakeUrl);
    expect(payload).toBe(fakeResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/flashcards/extract-text",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: fakeUrl }),
      })
    );
  });

  it("throws `Failed to extract text` if the response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    await expect(extractText(fakeUrl)).rejects.toThrow(
      "Failed to extract text"
    );
  });

  it("throws `Invalid response: `text` field is missing or not a string` if JSON has no `text` field", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await expect(extractText(fakeUrl)).rejects.toThrow(
      "Invalid response: `text` field is missing or not a string"
    );
  });

  it("throws `Invalid response: `text` field is missing or not a string` if JSON.text is not a string", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: null }),
    });
    await expect(extractText(fakeUrl)).rejects.toThrow(
      "Invalid response: `text` field is missing or not a string"
    );
  });
});

describe("generateCards helper - payload and JSON shape validation", () => {
  const fakeText = "Sample text for flashcards";

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("sends a POST request with the correct payload", async () => {
    const fakeCards = [
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cards: fakeCards }),
    });

    const payload = await generateCards(fakeText);
    expect(payload).toEqual(fakeCards);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/flashcards/generate",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: fakeText }),
      })
    );
  });

  it("throws `Failed to generate flashcards` if the response is not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Failed to generate flashcards"
    );
  });

  it("throws `Invalid response: `cards` field is missing or not an array` if JSON has no `cards` field", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Invalid response: `cards` field is missing or not an array"
    );
  });

  it("throws `Invalid response: `cards` field is missing or not an array` if JSON.cards is not an array", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cards: null }),
    });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Invalid response: `cards` field is missing or not an array"
    );
  });

  it("throws if any card is missing `question` or `answer` fields", async () => {
    const invalidCards = [
      { question: "Q1", answer: "A1" },
      { question: "Q2" }, // Missing answer
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cards: invalidCards }),
    });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Invalid Response: card at index 1 is malformed"
    );
  });

  it("throws if any card has non-string `question` or `answer`", async () => {
    const invalidCards = [
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: 123 },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cards: invalidCards }),
    });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Invalid Response: card at index 1 is malformed"
    );
  });

  it("throws if any card is not an object", async () => {
    const invalidCards = [{ question: "Q1", answer: "A1" }, "Not an object"];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cards: invalidCards }),
    });
    await expect(generateCards(fakeText)).rejects.toThrow(
      "Invalid Response: card at index 1 is malformed"
    );
  });
});
