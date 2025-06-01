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
     NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
     NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
     UPLOADTHING_TOKEN='eyJh...'
     OPENAI_API_KEY=sk-proj-...
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
