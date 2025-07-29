import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Session - Cramspresso",
  description:
    "Interactive flashcard study session with spaced repetition and progress tracking",
  robots: "noindex, nofollow", // Don't index study sessions (they're user-specific)
};

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
