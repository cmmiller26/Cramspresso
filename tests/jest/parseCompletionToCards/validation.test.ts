import { parseCompletionToCards } from "@/lib/flashcards";

describe("parseCompletionToCards - Invalid card structure validation", () => {
  describe("Invalid card structures in JSON", () => {
    it("falls back to regex when JSON cards are missing question field", () => {
      const invalidJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { answer: "Paris" }, // Missing question
      ]);

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });

    it("falls back to regex when JSON cards are missing answer field", () => {
      const invalidJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { question: "What is the capital of France?" }, // Missing answer
      ]);

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });

    it("falls back to regex when JSON cards have empty question", () => {
      const invalidJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { question: "", answer: "Paris" },
      ]);

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });

    it("falls back to regex when JSON cards have empty answer", () => {
      const invalidJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { question: "What is the capital of France?", answer: "" },
      ]);

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });

    it("falls back to regex when JSON cards have null values", () => {
      const invalidJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { question: null, answer: "Paris" },
      ]);

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });

    it("falls back to regex when JSON is not an array", () => {
      const invalidJson = JSON.stringify({
        question: "What is 2+2?",
        answer: "4",
      });

      const result = parseCompletionToCards(invalidJson);

      expect(result).toEqual([]);
    });
  });
});
