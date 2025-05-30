"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex justify-between items-center p-4 h-16">
      <nav className="flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>

      <div className="flex gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Sign Up</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
