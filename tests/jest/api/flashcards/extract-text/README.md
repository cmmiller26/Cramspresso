# Extract-Text API Route Tests

This directory contains comprehensive tests for the `/api/flashcards/extract-text` route, following the same testing patterns and structure used in the existing `/api/flashcards/generate` route tests.

## Test Structure

The tests are organized into separate files by functionality area:

### Core Test Files

1. **`validation.test.ts`** - Input validation and request handling
   - Missing/invalid URL parameters
   - Malformed request bodies
   - Invalid JSON parsing
   - Request method validation

2. **`network-fetch.test.ts`** - Network operations and HTTP handling
   - Successful fetch operations
   - HTTP error responses (404, 403, 500, etc.)
   - Network failures (DNS, connection refused, timeouts)
   - Response processing and edge cases

3. **`pdf-parsing.test.ts`** - PDF-specific processing
   - Successful PDF text extraction
   - Multi-page PDF handling
   - PDF parsing failures (corrupted files, password-protected)
   - Complex PDF content and encoding

4. **`text-processing.test.ts`** - Text file processing
   - Plain text files with various encodings
   - Different file formats (HTML, JSON, CSV, etc.)
   - Text encoding handling (UTF-8, ASCII, Latin-1)
   - Special characters and whitespace

5. **`file-limits.test.ts`** - File size limits and memory handling
   - Small and large file processing
   - Memory pressure scenarios
   - Performance boundaries
   - Resource cleanup

6. **`route.test.ts`** - Integration tests and end-to-end scenarios
   - Complete workflow testing
   - Real-world use cases
   - Concurrent request handling
   - Response format validation

## Test Coverage

The test suite covers:

### Success Scenarios
- ✅ Text file extraction (.txt, .html, .json, .csv, etc.)
- ✅ PDF text extraction (single and multi-page)
- ✅ Content type detection (header vs. file extension)
- ✅ Various text encodings (UTF-8, ASCII, etc.)
- ✅ Large file processing
- ✅ Concurrent requests

### Error Handling
- ✅ Network failures (DNS, connection, timeout)
- ✅ HTTP errors (404, 403, 500, etc.)
- ✅ PDF parsing errors (corrupted, password-protected)
- ✅ Invalid request formats
- ✅ Malformed URLs
- ✅ Empty or missing content

### Edge Cases
- ✅ Empty files
- ✅ Very large files (memory limits)
- ✅ Binary data processing
- ✅ Special characters and Unicode
- ✅ Missing content-type headers
- ✅ URLs with query parameters and fragments

## Dependencies and Mocking

The tests mock the following external dependencies:

1. **`pdf2json`** - PDF parsing library
   - Mocked to simulate successful parsing and various error conditions
   - Provides controlled PDF data structures for testing

2. **`global.fetch`** - Network requests
   - Mocked to simulate different response types and network conditions
   - Allows testing without actual network calls

## Running the Tests

```bash
# Run all extract-text tests
npm run test -- tests/jest/api/flashcards/extract-text

# Run specific test file
npm run test -- tests/jest/api/flashcards/extract-text/validation.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/api/flashcards/extract-text
```

## Test Patterns

The tests follow the same patterns established in the generate route tests:

### Request Creation Helper
```typescript
const createValidRequest = (url: string = "https://example.com/test.txt") =>
  new NextRequest("http://localhost/api/flashcards/extract-text", {
    method: "POST",
    body: JSON.stringify({ url }),
    headers: { "Content-Type": "application/json" },
  });
```

### Mock Setup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mocks to default state
});
```

### Response Validation
```typescript
expect(response.status).toBe(200);
expect(data).toHaveProperty("text");
expect(typeof data.text).toBe("string");
```

## Test Data and Fixtures

The tests use realistic test data including:

- Sample text content with various encodings
- Mock PDF data structures with multiple pages
- Network error simulations
- File size boundary conditions
- Real-world document examples

## Performance Considerations

The test suite includes performance tests for:

- Large file processing (up to 50MB)
- Concurrent request handling
- Memory usage patterns
- Processing time boundaries

## Error Scenarios Tested

### Network Errors
- DNS resolution failures
- Connection refused
- Request timeouts
- HTTP status errors (404, 403, 500, etc.)

### PDF Processing Errors
- Corrupted PDF files
- Password-protected PDFs
- Empty PDF files
- Parsing timeouts
- Invalid PDF structure

### Input Validation Errors
- Missing URL parameter
- Invalid URL formats
- Malformed JSON requests
- Unsupported request methods

## Future Enhancements

Potential areas for additional test coverage:

1. **Security Testing**
   - Malicious PDF files
   - XXE attacks via XML content
   - Path traversal in URLs

2. **Performance Testing**
   - Stress testing with many concurrent requests
   - Memory leak detection
   - Processing time limits

3. **Integration Testing**
   - End-to-end workflows with real file uploads
   - Integration with external services
   - Database interaction testing

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: The PDF parser mocking may show TypeScript warnings due to complex event handler types. These are expected and don't affect test functionality.

2. **Memory Usage**: Large file tests may consume significant memory. Adjust test data sizes if running in memory-constrained environments.

3. **Test Timeouts**: PDF parsing tests with complex mock data may take longer. Increase Jest timeout if needed.

### Debug Tips

- Use `console.log` in tests to debug mock behavior
- Check mock call counts with `expect(mockFn).toHaveBeenCalledTimes(n)`
- Verify mock implementations with `expect(mockFn).toHaveBeenCalledWith(...)`