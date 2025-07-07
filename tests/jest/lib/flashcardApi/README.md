# Flashcard API Client Library Tests

## Module Description

Tests for the client-side flashcard API wrapper functions in `src/lib/flashcardApi.ts`. These functions provide a clean interface for interacting with the flashcard generation and CRUD API endpoints, handling HTTP requests, response validation, and error handling.

## Test Coverage

The test suite covers API wrapper functions, HTTP request handling, response validation, error scenarios, and multi-URL workflows. Tests include network failures, malformed responses, input validation, and CRUD operations for flashcard sets and cards.

## Test Files

- **`base.test.ts`** - Fundamental functionality of each API wrapper function
- **`crud.test.ts`** - Parameterized tests for all CRUD operations
- **`generateFromUrls.test.ts`** - Multi-URL flashcard generation workflows
- **`helpers.test.ts`** - Individual helper functions (extractText, generateCards)

## Setup Requirements

- **Environment**: Node.js test environment
- **Dependencies**: `global.fetch` mocked for controlled HTTP testing
- **Configuration**: Jest with module path mapping for `@/*` imports
- **Mocking**: Fresh fetch mock reset before each test

## Running Tests

```bash
# Run all flashcard API client tests
npm run test:jest -- tests/jest/lib/flashcardApi

# Run specific test file
npm run test:jest -- tests/jest/lib/flashcardApi/base.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/lib/flashcardApi
```