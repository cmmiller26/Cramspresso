import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Wand2, ChevronDown } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  BULK_IMPROVEMENT_OPTIONS,
  type BulkImprovementOption,
} from "@/lib/types/create";

interface BulkImprovementsProps {
  selectedCount: number;
  isImproving: boolean;
  progress: number;
  currentOperation: string;
  onImprove: (
    improvement: string,
    customInstruction?: string,
    targetCardCount?: number
  ) => Promise<void>;
}

export function BulkImprovements({
  selectedCount,
  isImproving,
  progress,
  currentOperation,
  onImprove,
}: BulkImprovementsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<BulkImprovementOption | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const [targetCardCount, setTargetCardCount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAction = async (option: BulkImprovementOption) => {
    if (option.type === "custom" || option.requiresTargetCount) {
      setSelectedOption(option);
      setIsDialogOpen(true);
      return;
    }

    try {
      await onImprove(option.type);
    } catch (error) {
      console.error("Failed to improve cards:", error);
    }
  };

  const handleDialogSubmit = async () => {
    if (!selectedOption) return;

    if (selectedOption.type === "custom" && !customInstruction.trim()) return;
    if (selectedOption.requiresTargetCount && !targetCardCount.trim()) return;

    setIsSubmitting(true);
    try {
      await onImprove(
        selectedOption.type,
        selectedOption.type === "custom" ? customInstruction : undefined,
        selectedOption.requiresTargetCount
          ? parseInt(targetCardCount)
          : undefined
      );
      setIsDialogOpen(false);
      setCustomInstruction("");
      setTargetCardCount("");
      setSelectedOption(null);
    } catch (error) {
      console.error("Failed to apply improvements:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isImproving) {
    return (
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="font-medium">{currentOperation}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Processing {selectedCount} selected cards...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Bulk Actions:</span>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} card{selectedCount !== 1 ? "s" : ""} selected
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={selectedCount === 0}
              className="min-w-[140px]"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Improve Cards
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            {BULK_IMPROVEMENT_OPTIONS.map((option) => (
              <div key={option.type}>
                <DropdownMenuItem
                  onClick={() => handleQuickAction(option)}
                  className="flex flex-col items-start space-y-1 p-3"
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </DropdownMenuItem>
                {option.type === "fix_grammar" && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOption?.label}</DialogTitle>
            <DialogDescription>{selectedOption?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOption?.type === "custom" && (
              <div>
                <Label htmlFor="bulk-instruction">Instructions</Label>
                <Textarea
                  id="bulk-instruction"
                  placeholder="e.g., 'Add more context to vocabulary definitions'"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {selectedOption?.requiresTargetCount && (
              <div>
                <Label htmlFor="target-count">Target Number of Cards</Label>
                <Input
                  id="target-count"
                  type="number"
                  placeholder="e.g., 25"
                  value={targetCardCount}
                  onChange={(e) => setTargetCardCount(e.target.value)}
                  min="1"
                  max="50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {selectedCount} cards
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setCustomInstruction("");
                setTargetCardCount("");
                setSelectedOption(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={
                (selectedOption?.type === "custom" &&
                  !customInstruction.trim()) ||
                (selectedOption?.requiresTargetCount &&
                  !targetCardCount.trim()) ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Applying...
                </>
              ) : (
                "Apply to Selected"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
