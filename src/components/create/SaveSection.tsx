import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface SaveSectionProps {
  cards: Array<{ question: string; answer: string }>;
  isSaving: boolean;
  saveProgress: number;
  onSave: () => void;
  onCancel: () => void;
}

export function SaveSection({
  cards,
  isSaving,
  saveProgress,
  onSave,
  onCancel,
}: SaveSectionProps) {
  const [setName, setSetName] = useState("");

  const handleSave = () => {
    if (!setName.trim()) return;
    onSave();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">
          Save Your Flashcard Set
        </CardTitle>
        <p className="text-muted-foreground">
          Give your flashcard set a name and save it to your dashboard.
        </p>
      </CardHeader>
      <CardContent>
        {isSaving ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Saving flashcard set...
              </span>
            </div>
            <Progress value={saveProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {saveProgress}% complete
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Set Name
              </label>
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="Enter a name for your flashcard set"
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!setName.trim()}>
                Save Set ({cards.length} cards)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
