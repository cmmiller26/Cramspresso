"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { SampleCard } from "@/components/marketing/SampleCard";

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  // Show loading or nothing while redirecting authenticated users
  if (isSignedIn) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <title>Cramspresso - Turn Documents into Smart Flashcards</title>
      <meta
        name="description"
        content="Upload PDFs and documents to generate AI-powered flashcards. Study smarter with personalized Q&A cards created from your materials."
      />

      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <Hero />
          <Features />
          <SampleCard />
        </div>
      </main>
    </>
  );
}
