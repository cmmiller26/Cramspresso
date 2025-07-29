import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface BulkActionsProps {
  cardsCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAddCard: () => void;
}

export function BulkActions({
  cardsCount,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onAddCard,
}: BulkActionsProps) {
  return (
    <Card className="mb-6 bg-muted/30 border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCount === cardsCount && cardsCount > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectAll();
                  } else {
                    onClearSelection();
                  }
                }}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">
                Select All ({cardsCount})
              </span>
            </div>
          </div>

          <Button onClick={onAddCard} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
