"use client";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";

export function Hero() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { showError, clearError, renderError, hasError } = useErrorHandler();

  const handleGetStarted = async () => {
    try {
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        router.push("/sign-up");
      }
    } catch {
      showError(
        "GENERIC_ERROR",
        "Unable to navigate. Please try again.",
        {
          onRetry: handleGetStarted,
          onDismiss: clearError,
        }
      );
    }
  };

  return (
    <section className="text-center space-y-6 py-12">
      {/* Error display */}
      {hasError && (
        <div className="mb-6">
          {renderError()}
        </div>
      )}
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Turn Your Documents into
          <span className="text-primary"> Smart Flashcards</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload PDFs, text files, or notes and let AI generate personalized
          flashcards to help you study smarter, not harder.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <LoadingButton
          onClick={handleGetStarted}
          size="lg"
          className="px-8 py-3 text-lg"
          loadingText={isSignedIn ? "Loading Dashboard..." : "Setting Up..."}
        >
          {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
        </LoadingButton>
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-3 text-lg"
          onClick={() =>
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          See How It Works
        </Button>
      </div>
    </section>
  );
}
