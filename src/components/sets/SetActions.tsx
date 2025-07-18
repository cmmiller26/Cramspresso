"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen, Edit, Trash2, Download, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  setId: string;
  setName: string;
  cardCount: number;
  onDelete: () => Promise<void>;
  loading?: boolean;
}

export function SetActions({
  setId,
  setName,
  cardCount,
  onDelete,
  loading = false,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting set:", error);
      alert("Failed to delete set. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality in future phase
    alert("Export functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      {/* Back to Dashboard */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Main Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => router.push(`/study/${setId}`)}
          className="flex-1 sm:flex-none"
          disabled={loading || cardCount === 0}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Study {cardCount > 0 ? `(${cardCount})` : ""}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push(`/sets/${setId}/edit`)}
          className="flex-1 sm:flex-none"
          disabled={loading}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>

        <Button
          variant="outline"
          onClick={handleExport}
          className="flex-1 sm:flex-none"
          disabled={loading || cardCount === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {/* Delete with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none"
              disabled={loading || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Flashcard Set</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{setName}&quot;? This will
                permanently delete all {cardCount} cards in this set. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Set"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
