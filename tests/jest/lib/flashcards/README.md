# Flashcard Parsing Library Tests

## Module Description

Tests for the `parseCompletionToCards` function in `src/lib/flashcards.ts`. This function parses AI-generated text responses into structured flashcard objects, supporting both JSON format and Q: A: format with regex fallback parsing.

## Test Coverage

The test suite covers JSON parsing, regex fallback parsing, input validation, error handling, and edge cases. Tests include valid JSON arrays, malformed JSON recovery, Q: A: format parsing, large datasets, and special character handling.

## Test Files

- **`json-parsing.test.ts`** - Valid JSON flashcard array parsing
- **`regex-fallback.test.ts`** - Q: A: format parsing when JSON fails
- **`validation.test.ts`** - Input validation and error handling
- **`edge-cases.test.ts`** - Boundary conditions and complex scenarios

## Setup Requirements

- **Environment**: Node.js test environment
- **Dependencies**: No external dependencies required
- **Configuration**: Jest with module path mapping for `@/*` imports
- **Mocking**: Console error logging mocked for error testing

## Running Tests

```bash
# Run all flashcard parsing tests
npm run test:jest -- tests/jest/lib/flashcards

# Run specific test file
npm run test:jest -- tests/jest/lib/flashcards/json-parsing.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/lib/flashcards
```