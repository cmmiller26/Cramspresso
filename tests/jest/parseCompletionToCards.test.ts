import { parseCompletionToCards, Flashcard } from "@/lib/flashcards";

describe("parseCompletionToCards", () => {
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

  describe("Empty and null responses", () => {
    it("returns empty array for empty string", () => {
      const result = parseCompletionToCards("");

      expect(result).toEqual([]);
    });

    it("returns empty array for whitespace-only string", () => {
      const result = parseCompletionToCards("   \n\t  ");

      expect(result).toEqual([]);
    });

    it("returns empty array for string with no Q: A: patterns", () => {
      const result = parseCompletionToCards(
        "This is just some random text without any flashcard patterns."
      );

      expect(result).toEqual([]);
    });

    it("returns empty array for malformed Q: A: patterns", () => {
      const result = parseCompletionToCards(
        "Q: What is this? No answer follows"
      );

      expect(result).toEqual([]);
    });
  });

  describe("Mixed valid/invalid scenarios", () => {
    it("handles mixed Q: A: format with some incomplete patterns", () => {
      const mixedFormat = `Q: What is JavaScript?
A: A programming language

Q: What is incomplete?

Q: What is React?
A: A JavaScript library

Q: Another incomplete`;

      const result = parseCompletionToCards(mixedFormat);

      expect(result).toEqual([
        { question: "What is JavaScript?", answer: "A programming language" },
        { question: "What is React?", answer: "A JavaScript library" },
      ]);
    });

    it("handles Q: A: format mixed with other text", () => {
      const mixedFormat = `Here are some flashcards:

Q: What is HTML?
A: HyperText Markup Language

Some random text in between.

Q: What is CSS?
A: Cascading Style Sheets

More random text at the end.`;

      const result = parseCompletionToCards(mixedFormat);

      expect(result).toEqual([
        { question: "What is HTML?", answer: "HyperText Markup Language" },
        { question: "What is CSS?", answer: "Cascading Style Sheets" },
      ]);
    });
  });

  describe("Large responses and performance", () => {
    it("handles large number of flashcards in JSON format", () => {
      const largeArray: Flashcard[] = [];
      for (let i = 1; i <= 100; i++) {
        largeArray.push({
          question: `Question ${i}?`,
          answer: `Answer ${i}`,
        });
      }
      const largeJson = JSON.stringify(largeArray);

      const result = parseCompletionToCards(largeJson);

      expect(result).toHaveLength(100);
      expect(result[0]).toEqual({
        question: "Question 1?",
        answer: "Answer 1",
      });
      expect(result[99]).toEqual({
        question: "Question 100?",
        answer: "Answer 100",
      });
    });

    it("handles large number of flashcards in Q: A: format", () => {
      let largeQAFormat = "";
      for (let i = 1; i <= 50; i++) {
        largeQAFormat += `Q: Question ${i}?\nA: Answer ${i}\n\n`;
      }

      const result = parseCompletionToCards(largeQAFormat);

      expect(result).toHaveLength(50);
      expect(result[0]).toEqual({
        question: "Question 1?",
        answer: "Answer 1",
      });
      expect(result[49]).toEqual({
        question: "Question 50?",
        answer: "Answer 50",
      });
    });

    it("handles very long individual questions and answers", () => {
      const longQuestion = "What is ".repeat(100) + "the answer?";
      const longAnswer = "This is ".repeat(100) + "the answer.";

      const qAFormat = `Q: ${longQuestion}
A: ${longAnswer}

Q: Short question?
A: Short answer`;

      const result = parseCompletionToCards(qAFormat);

      expect(result).toHaveLength(2);
      expect(result[0].question).toBe(longQuestion);
      expect(result[0].answer).toBe(longAnswer);
      expect(result[1]).toEqual({
        question: "Short question?",
        answer: "Short answer",
      });
    });
  });

  describe("Edge cases and error handling", () => {
    it("handles JSON with extra properties", () => {
      const jsonWithExtra = JSON.stringify([
        {
          question: "What is TypeScript?",
          answer: "A typed superset of JavaScript",
          extraField: "ignored",
          anotherField: 123,
        },
      ]);

      const result = parseCompletionToCards(jsonWithExtra);

      expect(result).toEqual([
        {
          question: "What is TypeScript?",
          answer: "A typed superset of JavaScript",
          extraField: "ignored",
          anotherField: 123,
        },
      ]);
    });

    it("handles deeply nested JSON that's not a flashcard array", () => {
      const nestedJson = JSON.stringify({
        data: {
          flashcards: [{ question: "What is this?", answer: "Nested data" }],
        },
      });

      const result = parseCompletionToCards(nestedJson);

      expect(result).toEqual([]);
    });

    it("handles JSON with boolean and number values for question/answer", () => {
      const invalidTypesJson = JSON.stringify([
        { question: true, answer: "Boolean question" },
        { question: "Number answer", answer: 42 },
      ]);

      const result = parseCompletionToCards(invalidTypesJson);

      expect(result).toEqual([]);
    });

    it("handles Q: A: format with colons in questions and answers", () => {
      const colonFormat = `Q: What is the time format HH:MM:SS?
A: It represents hours:minutes:seconds

Q: What does CSS stand for?
A: Cascading Style Sheets: a styling language`;

      const result = parseCompletionToCards(colonFormat);

      expect(result).toEqual([
        {
          question: "What is the time format HH:MM:SS?",
          answer: "It represents hours:minutes:seconds",
        },
        {
          question: "What does CSS stand for?",
          answer: "Cascading Style Sheets: a styling language",
        },
      ]);
    });

    it("handles Q: A: format with Q: or A: in the content", () => {
      const confusingFormat = `Q: What does Q: mean in this format?
A: Q: indicates a question, A: indicates an answer

Q: Can answers contain Q: and A:?
A: Yes, Q: and A: can appear in content`;

      const result = parseCompletionToCards(confusingFormat);

      expect(result).toEqual([
        {
          question: "What does Q: mean in this format?",
          answer: "Q: indicates a question, A: indicates an answer",
        },
        {
          question: "Can answers contain Q: and A:?",
          answer: "Yes, Q: and A: can appear in content",
        },
      ]);
    });
  });

  describe("Console error logging", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("logs error when JSON parsing fails", () => {
      const invalidJson = "{ invalid json }";

      parseCompletionToCards(invalidJson);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to parse flashcards:",
        expect.any(Error)
      );
    });

    it("does not log error for valid JSON", () => {
      const validJson = JSON.stringify([
        { question: "What is 2+2?", answer: "4" },
      ]);

      parseCompletionToCards(validJson);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("does not log error for Q: A: format parsing", () => {
      const qAFormat = `Q: What is JavaScript?
A: A programming language`;

      parseCompletionToCards(qAFormat);

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
