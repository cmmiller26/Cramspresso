# Cramspresso

[![codecov](https://codecov.io/gh/cmmiller26/Cramspresso/branch/main/graph/badge.svg)](https://codecov.io/gh/cmmiller26/Cramspresso)

> AI-powered flashcards from your lecture notes and slides.

## Features

- Upload PDFs, text or plain-text notes
- Auto-generate Q&A flashcards via OpenAI
- Review & edit before you save
- Organize by course and topic

## Tech Stack

- **[Next.js](https://nextjs.org/)** (App Router + TypeScript)
- **[Tailwind CSS](https://tailwindcss.com/)** + **[ShadCN UI](https://ui.shadcn.com/)**
- **[Clerk](https://clerk.com/)** for auth
- **[PostgreSQL](https://www.postgresql.org/)** + **[Prisma](https://www.prisma.io/)**
- **[UploadThing](https://uploadthing.com/)** for file uploads
- **[OpenAI API](https://openai.com/api/)** for card generation

## Testing

### Unit & Integration Tests (Jest)
- Comprehensive test coverage for API routes, utility functions, and components
- Located in `tests/jest/` directory with separate suites for API and library functions
- Includes mocking for external dependencies (OpenAI, UploadThing, fetch)

### End-to-End Tests (Playwright)
- Complete user workflow testing including authentication and file uploads
- Cross-browser testing support (Chrome, Firefox, Safari)
- Located in `tests/e2e/` directory

### Test Coverage
- Automated coverage reporting with CodeCov integration
- Coverage badges displayed in repository

### Run All Tests
```bash
# Run all tests (Jest + Playwright)
npm run test

# Run only unit/integration tests
npm run test:jest

# Run with coverage report
npm run test:coverage

# Run only end-to-end tests
npm run test:e2e
```

## Getting Started

1. **Clone the repo & install dependencies**

   ```bash
   git clone https://github.com/cmmiller26/Cramspresso.git
   cd Cramspresso
   npm install
   ```

2. **Create environment files**

   - In the project root, create a file named `.env` with your database URL:
     ```ini
     DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database>"
     ```
   - Also create a file named `.env.local` with your Clerk, UploadThing, and OpenAI keys:
     ```ini
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
     NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
     NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
     NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
     UPLOADTHING_TOKEN='eyJh...'
     OPENAI_API_KEY=sk-proj-...
     
     # E2E Testing (optional)
     E2E_CLERK_USER_USERNAME=test@example.com
     E2E_CLERK_USER_PASSWORD=your_test_password
     ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

> **Note:**
>
> - `.env` is used by Prisma/Next.js server whenever it needs to connect to your Postgres database.
> - `.env.local` is for any secret keys or client-side “NEXT*PUBLIC*” values.
> - Do **not** commit either file; make sure both are in your `.gitignore`.

## Database Setup

### PostgreSQL Database
We recommend using **[Supabase](https://supabase.com/)** for managed PostgreSQL hosting:

1. Create a free Supabase account and new project
2. Copy the database URL from your project settings
3. Add it to your `.env` file as shown above

Alternatively, you can use a local PostgreSQL installation or other providers like Neon, Railway, or PlanetScale.

### Prisma Configuration
After setting up your database:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database with sample data
npx prisma db seed
```

### View Database (Optional)
```bash
# Open Prisma Studio to view/edit data
npx prisma studio
```

## Development Scripts

All available npm scripts and their purposes:

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build production application
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler checks

# Testing
npm run test         # Run all tests (Jest + Playwright)
npm run test:jest    # Run Jest unit tests only
npm run test:coverage # Run Jest with coverage report
npm run test:e2e     # Run Playwright end-to-end tests
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── flashcards/    # Flashcard generation & text extraction
│   │   │   └── sets/          # Flashcard set CRUD operations
│   │   ├── dashboard/         # Main application dashboard
│   │   ├── sign-in/           # Authentication pages
│   │   └── sign-up/
│   ├── components/            # Reusable React components
│   │   └── ui/                # ShadCN UI components
│   ├── lib/                   # Utility libraries
│   │   ├── flashcardApi.ts    # API client functions
│   │   └── flashcards.ts      # Parsing utilities
│   └── generated/
│       └── prisma/            # Generated Prisma client
├── tests/
│   ├── jest/                  # Unit & integration tests
│   │   ├── api/               # API route tests
│   │   └── lib/               # Library function tests
│   └── e2e/                   # End-to-end tests
├── prisma/                    # Database schema & migrations
└── public/                    # Static assets
```
