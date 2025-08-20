import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { CheckSquare, Square, Trash2, Wand2, X } from "lucide-react";
import type { SelectionControlsProps } from "@/lib/types/components";

export function SelectionControls({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  disabled = false,
  showSelectAll = true,
  showBulkActions = true,
  className = "",
}: SelectionControlsProps) {
  const allSelected = selectedCount === totalCount;
  const hasSelection = selectedCount > 0;

  if (!showBulkActions && !hasSelection) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Selection info */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-foreground">
              {hasSelection ? (
                <>
                  {selectedCount} of {totalCount} card
                  {selectedCount !== 1 ? "s" : ""} selected
                </>
              ) : (
                <>
                  {totalCount} card{totalCount !== 1 ? "s" : ""} total
                </>
              )}
            </div>

            {/* Selection controls */}
            {showSelectAll && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={allSelected ? onClearSelection : onSelectAll}
                  disabled={disabled || totalCount === 0}
                  className="text-xs"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Select All
                    </>
                  )}
                </Button>

                {hasSelection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bulk actions */}
          {showBulkActions && hasSelection && (
            <div className="flex items-center gap-2">
              <BulkActionsDropdown
                selectedCount={selectedCount}
                onBulkImprove={() => {
                  // This will be implemented in Phase 3 when we add bulk improvements
                  console.log("Bulk improve not yet implemented");
                }}
                disabled={disabled}
              />

              <LoadingButton
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={disabled}
                loading={false} // Loading state managed by parent
                loadingText="Deleting..."
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedCount})
              </LoadingButton>
            </div>
          )}
        </div>

        {/* Selection tips */}
        {!hasSelection && totalCount > 5 && (
          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Select multiple cards to delete or improve them in bulk
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BulkActionsDropdownProps {
  selectedCount: number;
  onBulkImprove: () => void;
  disabled?: boolean;
}

function BulkActionsDropdown({
  selectedCount,
  onBulkImprove,
  disabled = false,
}: BulkActionsDropdownProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onBulkImprove}
      disabled={disabled}
      className="text-xs"
    >
      <Wand2 className="w-4 h-4 mr-1" />
      Improve ({selectedCount})
    </Button>
  );
}
