"use client";

import { FormEvent, memo, useState } from "react";
import { Button } from "../ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { CreateFlashcard } from "@/lib/types/flashcards";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import * as setsApi from "@/lib/api/sets";
import { X } from "lucide-react";

interface Props {
  cards?: CreateFlashcard[];
  onCreate: (setId: string) => void;
  onCancel?: () => void;
  variant?: "dashboard" | "inline";
}

export const NewSetForm = memo(function NewSetForm({
  cards = [],
  onCreate,
  onCancel,
  variant = "inline",
}: Props) {
  const [name, setName] = useState("");
  const { showError, clearError, renderError, hasError } = useErrorHandler();

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    try {
      clearError(); // Clear any previous errors
      const { setId } = await setsApi.createSet(name, cards);
      onCreate(setId);
      setName(""); // Reset form on success
    } catch (err) {
      console.error(err);
      showError(
        "GENERIC_ERROR",
        err instanceof Error ? err.message : "Failed to create flashcard set",
        {
          onRetry: () => handleSubmit(),
          onDismiss: clearError,
        }
      );
    }
  };

  function handleCancel() {
    setName("");
    onCancel?.();
  }

  if (variant === "dashboard") {
    return (
      <div className="space-y-4">
        {/* Error display */}
        {hasError && renderError()}
        
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setName">Set Name</Label>
            <Input
              id="setName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your flashcard set"
              className="text-base"
            />
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <LoadingButton 
              onClick={handleSubmit}
              disabled={!name.trim()}
              loadingText="Creating..."
            >
              Create Set
            </LoadingButton>
          </div>
        </form>
      </div>
    );
  }

  // Original inline variant for backward compatibility
  return (
    <div className="space-y-4">
      {/* Error display */}
      {hasError && renderError()}
      
      <form className="flex gap-2 mb-6">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new set name"
          className="flex-grow"
        />
        <LoadingButton 
          onClick={handleSubmit}
          disabled={!name.trim()}
          loadingText="Creating..."
        >
          Save Set
        </LoadingButton>
      </form>
    </div>
  );
});
