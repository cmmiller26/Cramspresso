# OpenAI API Failure Handling Tests

This directory contains comprehensive tests for the `/api/flashcards/generate` endpoint, focusing on OpenAI API failure handling and edge cases.

## Test Structure

The tests are organized into four main categories:

### 1. Input Validation Tests (`input-validation.test.ts`)

- **Missing text field**: Returns 400 when text is not provided
- **Invalid text types**: Returns 400 for non-string values (numbers, arrays, objects, null, undefined)
- **Empty/whitespace text**: Returns 400 for empty strings or whitespace-only input
- **Invalid JSON**: Returns 400 for malformed request bodies

### 2. OpenAI API Failure Tests (`openai-failures.test.ts`)

- **Rate limiting (429)**: Returns 429 with user-friendly message
- **Authentication errors (401/403)**: Returns 502 with appropriate error messages
- **Request size errors (413)**: Returns 413 when text is too large
- **Server errors (500/502/503)**: Returns 502 with service unavailable message
- **Network errors**: Handles connection refused and timeout errors
- **Unknown errors**: Graceful fallback for unexpected error types

### 3. Response Parsing Tests (`response-parsing.test.ts`)

- **Invalid response structure**: Handles null/undefined responses and missing choices
- **Empty content**: Handles null, empty, or whitespace-only responses from OpenAI
- **Malformed JSON**: Gracefully handles invalid JSON by returning empty cards array
- **Valid responses**: Properly parses both JSON and Q: A: format responses

### 4. Success Scenarios Tests (`success-scenarios.test.ts`)

- **Valid flashcard generation**: Tests successful generation with various input formats
- **Empty results**: Handles cases where no flashcards can be generated
- **Large text inputs**: Ensures the API can handle substantial text content
- **Special characters**: Tests Unicode and special character handling
- **Formatted text**: Handles text with line breaks and formatting

## Key Features Tested

### Error Handling

- ✅ Rate limiting with proper HTTP status codes
- ✅ Authentication and authorization failures
- ✅ Network connectivity issues
- ✅ Malformed responses from OpenAI
- ✅ Input validation with descriptive error messages

### Response Formats

- ✅ JSON array format: `[{"question": "...", "answer": "..."}]`
- ✅ Q: A: format with regex fallback parsing
- ✅ Empty responses (returns empty array instead of error)
- ✅ Extra properties preservation in flashcard objects

### Edge Cases

- ✅ Large text inputs
- ✅ Unicode and special characters
- ✅ Various text formatting (line breaks, bullet points)
- ✅ Empty or invalid OpenAI responses

## Test Configuration

### Jest Setup

- **Environment**: Node.js (for API route testing)
- **Module mapping**: `@/*` → `src/*` for path aliases
- **Web API polyfills**: Request/Response/Headers for Next.js compatibility
- **OpenAI mocking**: Comprehensive mock setup for all failure scenarios

### Mock Strategy

- Each test creates a fresh `NextRequest` to avoid body reuse issues
- OpenAI client is mocked at the module level
- Error objects include proper `status` and `code` properties for realistic testing
- Type-safe mocks using proper TypeScript interfaces

## Running the Tests

```bash
# Run all API tests
npm run test:jest -- tests/jest/api/flashcards/generate

# Run specific test file
npm run test:jest -- tests/jest/api/flashcards/generate/openai-failures.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/api/flashcards/generate
```

## Test Coverage

The test suite covers:

- **46 test cases** across 4 test files
- **All major error scenarios** that can occur with OpenAI API
- **Input validation** for all request formats
- **Response parsing** for all OpenAI response formats
- **Success scenarios** with various text inputs

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "User-friendly error message"
}
```

Success responses:

```json
{
  "cards": [{ "question": "...", "answer": "..." }]
}
```

## Implementation Notes

- The API route includes comprehensive error handling for all OpenAI failure modes
- User-friendly error messages are provided for all failure scenarios
- The `parseCompletionToCards` function gracefully handles malformed responses
- Network errors and timeouts are properly categorized and handled
- Rate limiting is passed through with the original 429 status code
