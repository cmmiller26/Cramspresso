"use client";

import { memo } from "react";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { useLoadingState, LOADING_STATES } from "@/hooks/shared/useLoadingState";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import { useRouter } from "next/navigation";
import { BookOpen, Edit, Trash2, Download } from "lucide-react";
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

export const SetActions = memo(function SetActions({
  setId,
  setName,
  cardCount,
  onDelete,
  loading = false,
}: Props) {
  const router = useRouter();
  
  // Shared infrastructure for loading states
  const { setLoading, isLoading } = useLoadingState([LOADING_STATES.SET_DELETE]);
  
  // Shared infrastructure for error handling
  const { showError, clearError, renderError, hasError } = useErrorHandler();

  const handleDelete = async () => {
    setLoading(LOADING_STATES.SET_DELETE, true);
    try {
      clearError();
      await onDelete();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting set:", error);
      showError(
        "SET_DELETE_ERROR",
        error instanceof Error ? error.message : "Failed to delete set. Please try again.",
        {
          onRetry: () => handleDelete(),
          onDismiss: clearError,
        }
      );
    } finally {
      setLoading(LOADING_STATES.SET_DELETE, false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality in future phase
    showError(
      "EXPORT_NOT_IMPLEMENTED",
      "Export functionality is coming soon! We're working on adding PDF, CSV, and JSON export options.",
      { onDismiss: clearError }
    );
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {hasError && renderError()}

      {/* Main Actions */}
      <div className="flex flex-wrap gap-3">
        <LoadingButton
          onClick={async () => router.push(`/study/${setId}`)}
          className="flex-1 sm:flex-none"
          disabled={loading || cardCount === 0}
          loadingText="Loading Study..."
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Study {cardCount > 0 ? `(${cardCount})` : ""}
        </LoadingButton>

        <LoadingButton
          variant="outline"
          onClick={async () => router.push(`/sets/${setId}/edit`)}
          className="flex-1 sm:flex-none"
          disabled={loading}
          loadingText="Loading Editor..."
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </LoadingButton>

        <LoadingButton
          variant="outline"
          onClick={async () => handleExport()}
          className="flex-1 sm:flex-none"
          disabled={loading || cardCount === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </LoadingButton>

        {/* Delete with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <LoadingButton
              variant="destructive"
              className="flex-1 sm:flex-none"
              disabled={loading || isLoading(LOADING_STATES.SET_DELETE)}
              loadingText="Deleting..."
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </LoadingButton>
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
                {isLoading(LOADING_STATES.SET_DELETE) ? "Deleting..." : "Delete Set"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});
