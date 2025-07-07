# Flashcard Generation API Tests

## Module Description

Tests for the `/api/flashcards/generate` endpoint which accepts text input and generates flashcard Q&A pairs using OpenAI's GPT API. The endpoint handles text processing, AI generation, and response parsing with comprehensive error handling.

## Test Coverage

The test suite covers input validation, OpenAI API interactions, response parsing, error handling, and success scenarios. Tests include OpenAI API failures, network errors, malformed responses, and various text input formats.

## Test Files

- **`input-validation.test.ts`** - Request validation and malformed inputs
- **`openai-failures.test.ts`** - OpenAI API error scenarios and rate limiting
- **`response-parsing.test.ts`** - Response format handling and parsing
- **`success-scenarios.test.ts`** - Valid generation with various text inputs

## Setup Requirements

- **Environment**: Node.js test environment
- **Dependencies**: OpenAI client mocked for controlled testing
- **Configuration**: Jest with Next.js API route support
- **Mocking**: `global.fetch` and OpenAI client module mocks

## Running Tests

```bash
# Run all generation endpoint tests
npm run test:jest -- tests/jest/api/flashcards/generate

# Run specific test file
npm run test:jest -- tests/jest/api/flashcards/generate/input-validation.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/api/flashcards/generate
```