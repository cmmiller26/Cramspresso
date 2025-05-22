# Cramspresso

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
    git clone https://github.com/cmmiller26/Cramspresso
    cd cramspresso
    npm install
    ```
2. **Create a `.env.local` file in the root of the project with the following content:**
    ```ini
    DATABASE_URL=your_postgres_url
    CLERK_FRONTEND_API=your_clerk_frontend_api
    CLERK_API_KEY=your_clerk_api_key
    OPENAI_API_KEY=your_openai_api_key
    UPLOADTHING_SECRET=your_uploadthing_secret
    ```
3. **Start the development server**
    ```bash
    npm run dev
    ```
4. **Open your browser and go to:**
    http://localhost:3000
