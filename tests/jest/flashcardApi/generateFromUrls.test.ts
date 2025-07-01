import { generateFromUrls } from "@/lib/flashcardApi";

describe("generateFromUrls - multiple-URL flattening & edge cases", () => {
  const url1 = "https://example.com/page1";
  const url2 = "https://example.com/page2";

  const fakeText1 = "Text from page 1";
  const fakeText2 = "Text from page 2";

  const fakeCards1 = [
    { question: "Q1a", answer: "A1a" },
    { question: "Q1b", answer: "A1b" },
  ];
  const fakeCards2 = [{ question: "Q2", answer: "A2" }];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it("concatenates cards from two URLs", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: fakeText1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: fakeText2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cards: fakeCards1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cards: fakeCards2 }),
      });

    const result = await generateFromUrls([url1, url2]);
    expect(result).toEqual([...fakeCards1, ...fakeCards2]);
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/flashcards/extract-text",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url1 }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/flashcards/extract-text",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url2 }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/flashcards/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fakeText1 }),
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      4,
      "/api/flashcards/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fakeText2 }),
      })
    );
  });

  it("rejects early if one extractText call fails", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: fakeText1 }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    await expect(generateFromUrls([url1, url2])).rejects.toThrow(
      "Failed to extract text"
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("resolves with empty array if no URLs provided", async () => {
    await expect(generateFromUrls([])).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws if called with non-array input", async () => {
    // @ts-expect-error: Testing invalid input
    await expect(generateFromUrls(null)).rejects.toThrow(
      "URLs must be an array of strings"
    );
  });

  it("throws if called with non-string array elements", async () => {
    // @ts-expect-error: Testing invalid input
    await expect(generateFromUrls([123])).rejects.toThrow(
      "URLs must be an array of strings"
    );
  });

  it("propagates a fetch rejection (network error) during extraction", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );
    await expect(generateFromUrls([url1])).rejects.toThrow("Network error");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws if called with array containing mixed valid and invalid types", async () => {
    await expect(
      generateFromUrls(["valid-url", null, "another-valid-url"] as string[])
    ).rejects.toThrow("URLs must be an array of strings");
  });

  it("throws if called with array containing undefined", async () => {
    // @ts-expect-error: Testing invalid input
    await expect(generateFromUrls(["valid-url", undefined])).rejects.toThrow(
      "URLs must be an array of strings"
    );
  });

  it("throws if called with array containing boolean", async () => {
    // @ts-expect-error: Testing invalid input
    await expect(generateFromUrls([true, "valid-url"])).rejects.toThrow(
      "URLs must be an array of strings"
    );
  });
});
