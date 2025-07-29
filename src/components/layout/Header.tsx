"use client";

import { useAuth, SignOutButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useRouter } from "next/navigation";

export function Header() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          Cramspresso
        </Link>

        <nav className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <ThemeToggle />
              <SignOutButton>
                <Button variant="outline">Sign Out</Button>
              </SignOutButton>
            </>
          ) : (
            <>
              <ThemeToggle />
              <SignInButton mode="modal">
                <Button variant="outline">Sign In</Button>
              </SignInButton>
              <Button onClick={() => router.push("/sign-up")}>
                Get Started
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
