import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Create Set | Cramspresso",
    default: "Create Set | Cramspresso",
  },
  description: "Create and customize your AI-generated flashcard sets",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <h2 className="font-semibold text-foreground">
                Create Flashcard Set
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="bg-background">{children}</main>
    </div>
  );
}
