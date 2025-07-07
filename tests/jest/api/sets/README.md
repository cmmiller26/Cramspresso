# Sets API Tests

## Module Description

Tests for the flashcard sets API endpoints which handle CRUD operations for flashcard sets and their associated cards. The endpoints support set creation, retrieval, updating, deletion, and card management with Clerk authentication and user-scoped access control.

## Test Coverage

The test suite covers authentication flows, authorization checks, input validation, database operations, error handling, and success scenarios. Tests include unauthenticated requests, cross-user access prevention, constraint violations, and comprehensive CRUD operations.

## Test Files

- **`route.test.ts`** - Tests for GET/POST `/api/sets` endpoints
- **`[setId].test.ts`** - Tests for GET/PATCH/DELETE `/api/sets/[setId]` endpoints  
- **`cards/route.test.ts`** - Tests for POST `/api/sets/[setId]/cards` endpoint
- **`cards/[cardId].test.ts`** - Tests for PATCH/DELETE `/api/sets/[setId]/cards/[cardId]` endpoints

## Setup Requirements

- **Environment**: Node.js test environment with jsdom
- **Dependencies**: Clerk authentication and Prisma ORM mocked for controlled testing
- **Configuration**: Jest with Next.js API route support and TypeScript
- **Mocking**: `@clerk/nextjs/server` and `@/lib/prisma` module mocks

## Mock Strategy

### Authentication Mocking
```typescript
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
```

### Database Mocking
```typescript
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    flashcardSet: { 
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    flashcard: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));
```

### Mock Data Types
```typescript
type MockUser = {
  id: string;
  clerkId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

type MockFlashcardSet = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cards?: MockFlashcard[];
  _count?: { cards: number };
};

type MockFlashcard = {
  id: string;
  question: string;
  answer: string;
  setId: string;
  createdAt: string;
  updatedAt: string;
};
```

## Test File Details

### route.test.ts - Sets Collection Endpoints

**Purpose**: Tests GET and POST operations on `/api/sets`

**Test Coverage**:
- **GET /api/sets**:
  - Successfully fetches user's sets with card counts
  - Returns empty array for users with no sets
  - Returns 401 for unauthenticated requests
  - Returns 404 when user not found in database
  
- **POST /api/sets**:
  - Successfully creates set with valid cards
  - Returns 401 for unauthenticated requests
  - Validates set name (empty, whitespace, wrong type)
  - Validates cards data (not array, empty array, invalid format)
  - Handles database constraint violations
  - Trims whitespace from set names
  - Uses connectOrCreate for user relationships
  - Creates multiple cards correctly

**Key Test Patterns**:
```typescript
const createValidRequest = (body: object) =>
  new NextRequest("http://localhost/api/sets", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
```

### [setId].test.ts - Individual Set Operations

**Purpose**: Tests GET, PATCH, and DELETE operations on `/api/sets/[setId]`

**Test Coverage**:
- **GET /api/sets/[setId]**:
  - Successfully fetches set with cards for owner
  - Returns 401 for unauthenticated requests
  - Returns 404 when user not found
  - Returns 404 when set not found
  - Prevents access to other users' sets
  
- **PATCH /api/sets/[setId]**:
  - Successfully updates set name
  - Validates set name format
  - Returns proper error codes for invalid inputs
  - Handles database errors gracefully
  - Trims whitespace from updated names
  
- **DELETE /api/sets/[setId]**:
  - Successfully deletes set with cascade
  - Verifies set ownership before deletion
  - Returns 404 for non-existent sets
  - Handles database errors during deletion

**Dynamic Route Mocking**:
```typescript
const mockParams = Promise.resolve({ setId: "set_test_123" });

const response = await GET(
  new NextRequest("http://localhost/api/sets/set_test_123"),
  { params: mockParams }
);
```

### cards/route.test.ts - Card Collection Operations

**Purpose**: Tests POST operations on `/api/sets/[setId]/cards`

**Test Coverage**:
- Successfully adds multiple cards to existing set
- Returns 401 for unauthenticated requests
- Returns 404 when user or set not found
- Prevents adding cards to other users' sets
- Validates cards data format thoroughly
- Handles skipDuplicates behavior correctly
- Processes large batches of cards efficiently
- Returns actual insertion count

**Bulk Operations Testing**:
```typescript
const largeCardBatch = Array.from({ length: 100 }, (_, i) => ({
  question: `Question ${i + 1}`,
  answer: `Answer ${i + 1}`,
}));

mockPrisma.flashcard.createMany.mockResolvedValue({ count: 100 });
```

### cards/[cardId].test.ts - Individual Card Operations

**Purpose**: Tests PATCH and DELETE operations on `/api/sets/[setId]/cards/[cardId]`

**Test Coverage**:
- **PATCH /api/sets/[setId]/cards/[cardId]**:
  - Successfully updates card question and answer
  - Validates question and answer format
  - Returns 404 for non-existent cards
  - Verifies card ownership through set relationship
  - Handles database errors during updates
  
- **DELETE /api/sets/[setId]/cards/[cardId]**:
  - Successfully deletes individual cards
  - Verifies card ownership before deletion
  - Validates setId and cardId parameters
  - Handles database errors gracefully
  - Removes card without affecting others

**Multi-Parameter Mocking**:
```typescript
const mockParams = Promise.resolve({
  setId: "set_test_123",
  cardId: "card_test_123",
});

// Card ownership verification
mockPrisma.flashcard.findUnique.mockResolvedValue(mockCard as any);
expect(mockPrisma.flashcard.findUnique).toHaveBeenCalledWith({
  where: {
    id: "card_test_123",
    set: { id: "set_test_123", userId: "user_test_123" },
  },
});
```

## Test Patterns

### Authentication Setup
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

// Valid authentication
mockAuth.mockResolvedValue({ userId: "clerk_test_user_123" } as any);
mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

// Unauthenticated request
mockAuth.mockResolvedValue({ userId: null } as any);
```

### Request Helpers
```typescript
const createValidRequest = (body: object) =>
  new NextRequest("http://localhost/api/endpoint", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
```

### Error Simulation
```typescript
// Database constraint violation
mockPrisma.flashcardSet.create.mockRejectedValue(
  new Error("Unique constraint failed")
);

// Unknown error handling
mockPrisma.flashcardSet.create.mockRejectedValue("Unknown error");
```

### Date Serialization
```typescript
// Use ISO string format for consistency
const mockSet = {
  id: "set_123",
  name: "Test Set",
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};
```

## Running Tests

```bash
# Run all sets API tests
npm run test:jest -- tests/jest/api/sets

# Run specific test file
npm run test:jest -- tests/jest/api/sets/route.test.ts

# Run with coverage
npm run test:coverage -- tests/jest/api/sets

# Run in watch mode
npm run test:jest -- --watch tests/jest/api/sets

# Run specific test suite
npm run test:jest -- --testNamePattern="GET /api/sets"
```

## Common Test Scenarios

### Authentication Tests
- **401 Unauthorized**: `mockAuth.mockResolvedValue({ userId: null })`
- **404 User Not Found**: `mockPrisma.user.findUnique.mockResolvedValue(null)`
- **Valid Authentication**: Mock both auth and user lookup

### Authorization Tests
- **Own Resource Access**: Match user IDs in mock data
- **Cross-User Access**: Use different user IDs to trigger 404s
- **Resource Ownership**: Verify database queries include userId filters

### Validation Tests
- **Empty Strings**: `""` and `"   "` for string fields
- **Wrong Types**: Numbers, objects, arrays for string fields
- **Missing Fields**: Omit required properties from request bodies
- **Invalid Arrays**: Non-arrays, empty arrays for card data

### Success Scenarios
- **Valid Requests**: Complete, properly formatted request bodies
- **Database Calls**: Verify correct Prisma method calls with expected parameters
- **Response Format**: Check response structure and status codes

## Troubleshooting

### Common Issues

**Mock Function Errors**:
```typescript
// Problem: mockResolvedValue is not a function
// Solution: Ensure proper mock setup
const mockAuth = auth as jest.MockedFunction<typeof auth>;
```

**Type Assertions**:
```typescript
// Use eslint-disable for necessary type assertions
/* eslint-disable @typescript-eslint/no-explicit-any */
mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
```

**Date Serialization**:
```typescript
// Problem: Date object serialization mismatches
// Solution: Use ISO string format consistently
createdAt: "2023-01-01T00:00:00.000Z" // ✓ Correct
createdAt: new Date("2023-01-01") // ✗ Causes issues
```

**Mock Isolation**:
```typescript
// Always clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Parameter Promises**:
```typescript
// Next.js 15 App Router uses Promise-based params
const mockParams = Promise.resolve({ setId: "set_123" });
// Not: const mockParams = { setId: "set_123" }
```

## Test Data Standards

### Consistent IDs
- User IDs: `"user_test_123"`
- Clerk IDs: `"clerk_test_user_123"`
- Set IDs: `"set_test_123"`
- Card IDs: `"card_test_123"`

### Mock Email Format
- Primary: `"john+clerk_test@example.com"`
- Alternative users: `"other+clerk_test@example.com"`

### Timestamp Format
- ISO 8601: `"2023-01-01T00:00:00.000Z"`
- Sequential dates for ordering tests: `"2023-01-02T00:00:00.000Z"`