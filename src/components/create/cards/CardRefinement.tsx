import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shuffle, ChevronDown } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  CARD_REFINEMENT_OPTIONS,
  type CardRefinementOption,
} from "@/lib/types/create";

interface CardRefinementProps {
  cardId: string;
  isRegenerating: boolean;
  // FIXED: Support both sync and async regenerate functions
  onRegenerate: (instruction: string) => Promise<void>;
}

export function CardRefinement({
  isRegenerating,
  onRegenerate,
}: CardRefinementProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAction = async (option: CardRefinementOption) => {
    if (option.instruction === "custom") {
      setIsCustomDialogOpen(true);
      return;
    }

    try {
      // FIXED: Always handle as async since the type expects Promise<void>
      await onRegenerate(option.instruction);
    } catch (error) {
      // Error handling is managed by the parent component
      console.error("Failed to regenerate card:", error);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customInstruction.trim()) return;

    setIsSubmitting(true);
    try {
      // FIXED: Always handle as async since the type expects Promise<void>
      await onRegenerate(customInstruction.trim());
      setIsCustomDialogOpen(false);
      setCustomInstruction("");
    } catch (error) {
      console.error("Failed to apply custom instruction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isRegenerating}
            className="min-w-[100px]"
          >
            {isRegenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 mr-2" />
                Regenerate
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {CARD_REFINEMENT_OPTIONS.map((option) => (
            <div key={option.instruction}>
              <DropdownMenuItem
                onClick={() => handleQuickAction(option)}
                className="flex flex-col items-start space-y-1 p-3"
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </DropdownMenuItem>
              {option.instruction === "make_clearer" && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Instruction Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Custom Regeneration</DialogTitle>
            <DialogDescription>
              Provide specific instructions for how to improve this card
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-instruction">Instructions</Label>
              <Textarea
                id="custom-instruction"
                placeholder="e.g., 'Add a real-world example to the answer' or 'Make the question more specific'"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomDialogOpen(false);
                setCustomInstruction("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomSubmit}
              disabled={!customInstruction.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Applying...
                </>
              ) : (
                "Apply Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
