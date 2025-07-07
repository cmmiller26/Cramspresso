# Text Extraction API Tests

## Module Description

Tests for the `/api/flashcards/extract-text` endpoint which extracts text content from URLs, supporting both text files and PDF documents. The endpoint handles network requests, content type detection, PDF parsing, and text encoding.

## Test Coverage

The test suite covers URL validation, network operations, PDF parsing, text file processing, file size limits, and integration scenarios. Tests include network failures, PDF parsing errors, encoding issues, and performance boundaries.

## Test Files

- **`validation.test.ts`** - Input validation and request handling
- **`network-fetch.test.ts`** - Network operations and HTTP handling
- **`pdf-parsing.test.ts`** - PDF text extraction and parsing
- **`text-processing.test.ts`** - Text file processing and encoding
- **`file-limits.test.ts`** - File size limits and memory handling
- **`route.test.ts`** - Integration tests and end-to-end scenarios

## Setup Requirements

- **Environment**: Node.js test environment
- **Dependencies**: `pdf2json` and `global.fetch` mocked for controlled testing
- **Configuration**: Jest with Next.js API route support
- **Mocking**: PDF parser and network request mocks

## Running Tests

```bash
# Run all extract-text endpoint tests
npm run test:jest -- tests/jest/api/flashcards/extract-text

# Run specific test file
npm run test:jest -- tests/jest/api/flashcards/extract-text/validation.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/api/flashcards/extract-text
```