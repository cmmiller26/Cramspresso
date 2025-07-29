import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Loader2, CheckCircle } from "lucide-react";

interface ReviewHeaderProps {
  cardsCount: number;
  selectedCount: number;
  viewMode: "preview" | "edit";
  onViewModeChange: (mode: "preview" | "edit") => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  bulkOperationLoading: boolean;
}

export function ReviewHeader({
  cardsCount,
  selectedCount,
  viewMode,
  onViewModeChange,
  onBulkDelete,
  onClearSelection,
  bulkOperationLoading,
}: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Review Your Flashcards
          </h1>
          <p className="text-muted-foreground text-lg">
            {cardsCount} flashcards generated successfully. Review, edit, and
            save your set.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCount} selected</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              disabled={bulkOperationLoading}
            >
              {bulkOperationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={viewMode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("edit")}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
