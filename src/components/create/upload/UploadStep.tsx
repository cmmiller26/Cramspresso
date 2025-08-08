import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "./FileUploader";
import { useErrorHandler } from "@/hooks/shared/useErrorHandler";
import type { UploadStepProps } from "@/lib/types/components";

export function UploadStep({
  onFileUploaded,
  onTextInput,
  onUploadCancelled,
  isExtracting = false,
  error,
  className = "",
}: UploadStepProps) {
  const { renderError } = useErrorHandler();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {error && renderError()}

      {/* File Upload Interface */}
      <FileUploader
        onFileUploaded={onFileUploaded}
        onTextInput={onTextInput}
        onUploadCancelled={onUploadCancelled}
        isExtracting={isExtracting}
      />

      {/* Tips Card */}
      <TipsCard />
    </div>
  );
}

function TipsCard() {
  return (
    <Card className="bg-muted/50 border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          💡 Tips for Best Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            • Upload well-structured content (textbooks, lecture notes,
            articles)
          </li>
          <li>
            • Longer texts (500+ words) generate more comprehensive flashcards
          </li>
          <li>
            • AI automatically determines the best question types for your
            content
          </li>
          <li>
            • You can edit and refine all generated cards in the next step
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
