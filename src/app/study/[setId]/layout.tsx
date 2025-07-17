import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Session - Cramspresso",
  description: "Interactive flashcard study session",
};

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
