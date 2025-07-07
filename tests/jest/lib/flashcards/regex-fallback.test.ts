import { parseCompletionToCards } from "@/lib/flashcards";

describe("parseCompletionToCards - Q: A: format regex fallback parsing", () => {
  describe("Invalid JSON that requires regex fallback", () => {
    it("falls back to regex parsing for malformed JSON", () => {
      const malformedJson = `[
          { "question": "What is 2+2?", "answer": "4" },
          { "question": "What is 3+3?", "answer": "6" // Missing closing quote and bracket
        `;

      const result = parseCompletionToCards(malformedJson);

      expect(result).toEqual([]);
    });

    it("parses Q: A: format using regex fallback", () => {
      const qAFormat = `Q: What is JavaScript?
  A: A programming language
  
  Q: What is React?
  A: A JavaScript library for building user interfaces`;

      const result = parseCompletionToCards(qAFormat);

      expect(result).toEqual([
        { question: "What is JavaScript?", answer: "A programming language" },
        {
          question: "What is React?",
          answer: "A JavaScript library for building user interfaces",
        },
      ]);
    });

    it("parses Q: A: format with extra whitespace", () => {
      const qAFormat = `Q:   What is Node.js?   
  A:   A JavaScript runtime environment   
  
  Q:  What is npm?  
  A:  Node Package Manager  `;

      const result = parseCompletionToCards(qAFormat);

      expect(result).toEqual([
        {
          question: "What is Node.js?",
          answer: "A JavaScript runtime environment",
        },
        { question: "What is npm?", answer: "Node Package Manager" },
      ]);
    });

    it("parses Q: A: format with mixed line endings", () => {
      const qAFormat =
        "Q: What is HTML?\r\nA: HyperText Markup Language\r\n\r\nQ: What is CSS?\nA: Cascading Style Sheets";

      const result = parseCompletionToCards(qAFormat);

      expect(result).toEqual([
        { question: "What is HTML?", answer: "HyperText Markup Language" },
        { question: "What is CSS?", answer: "Cascading Style Sheets" },
      ]);
    });

    it("parses Q: A: format with multiline answers", () => {
      const qAFormat = `Q: What is a function in JavaScript?
  A: A function is a block of code
  that performs a specific task
  and can be reused
  
  Q: What is an array?
  A: An ordered list of elements`;

      const result = parseCompletionToCards(qAFormat);

      expect(result).toEqual([
        {
          question: "What is a function in JavaScript?",
          answer:
            "A function is a block of code\nthat performs a specific task\nand can be reused",
        },
        {
          question: "What is an array?",
          answer: "An ordered list of elements",
        },
      ]);
    });

    it("handles Q: A: format with special characters", () => {
      const qAFormat = `Q: What is π?
  A: π ≈ 3.14159
  
  Q: How do you say "hello" in French?
  A: "Bonjour"`;

      const result = parseCompletionToCards(qAFormat);

      expect(result).toEqual([
        { question: "What is π?", answer: "π ≈ 3.14159" },
        { question: 'How do you say "hello" in French?', answer: '"Bonjour"' },
      ]);
    });
  });
});
