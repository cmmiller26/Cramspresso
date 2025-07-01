import { parseCompletionToCards } from "@/lib/flashcards";

describe("parseCompletionToCards - Valid JSON parsing scenarios", () => {
  describe("Valid JSON parsing scenarios", () => {
    it("parses valid JSON array of flashcards", () => {
      const validJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
        { question: "What is the capital of France?", answer: "Paris" },
      ]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([
        { question: "What is 2+2?", answer: "4" },
        { question: "What is the capital of France?", answer: "Paris" },
      ]);
    });

    it("parses valid JSON with single flashcard", () => {
      const validJson = JSON.stringify([
        { question: "What is JavaScript?", answer: "A programming language" },
      ]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([
        { question: "What is JavaScript?", answer: "A programming language" },
      ]);
    });

    it("parses valid JSON with optional id fields", () => {
      const validJson = JSON.stringify([
        { id: "1", question: "What is React?", answer: "A JavaScript library" },
        { question: "What is Node.js?", answer: "A JavaScript runtime" },
      ]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([
        { id: "1", question: "What is React?", answer: "A JavaScript library" },
        { question: "What is Node.js?", answer: "A JavaScript runtime" },
      ]);
    });

    it("handles empty valid JSON array", () => {
      const validJson = JSON.stringify([]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([]);
    });

    it("parses JSON with special characters and unicode", () => {
      const validJson = JSON.stringify([
        { question: "What is π (pi)?", answer: "≈ 3.14159" },
        {
          question: "How do you say 'hello' in Japanese?",
          answer: "こんにちは",
        },
        {
          question: "What's a quote example?",
          answer: 'He said "Hello world!"',
        },
      ]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([
        { question: "What is π (pi)?", answer: "≈ 3.14159" },
        {
          question: "How do you say 'hello' in Japanese?",
          answer: "こんにちは",
        },
        {
          question: "What's a quote example?",
          answer: 'He said "Hello world!"',
        },
      ]);
    });

    it("parses JSON with whitespace in questions and answers", () => {
      const validJson = JSON.stringify([
        {
          question: "  What is HTML?  ",
          answer: "  HyperText Markup Language  ",
        },
        { question: "What is\nCSS?", answer: "Cascading\nStyle Sheets" },
      ]);

      const result = parseCompletionToCards(validJson);

      expect(result).toEqual([
        {
          question: "  What is HTML?  ",
          answer: "  HyperText Markup Language  ",
        },
        { question: "What is\nCSS?", answer: "Cascading\nStyle Sheets" },
      ]);
    });
  });
});
