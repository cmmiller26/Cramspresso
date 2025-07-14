"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface FilePreviewProps {
  fileName?: string;
  extractedText: string;
  isExtracting?: boolean;
  onRetry?: () => void;
  source: "file" | "text";
}

export function FilePreview({
  fileName,
  extractedText,
  isExtracting = false,
  onRetry,
  source,
}: FilePreviewProps) {
  const [showFullText, setShowFullText] = useState(false);

  const wordCount = extractedText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = extractedText.length;
  const estimatedCards = Math.max(1, Math.floor(wordCount / 50)); // Rough estimate

  const previewText = showFullText
    ? extractedText
    : extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : "");

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName
      ? `${fileName.split(".")[0]}_extracted.txt`
      : "extracted_text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isExtracting) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 animate-pulse" />
            Extracting Text...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <span className="ml-2">
                Processing your {source === "file" ? "file" : "text"}...
              </span>
            </div>
            <div className="h-32 bg-muted/30 rounded-lg animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {source === "file" ? "Extracted Text" : "Your Text"}
            {fileName && (
              <span className="text-sm font-normal text-muted-foreground">
                from {fileName}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownloadText}>
              <Download className="w-4 h-4" />
            </Button>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {wordCount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {charCount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {estimatedCards}
            </div>
            <div className="text-sm text-muted-foreground">Est. Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {wordCount >= 100 ? "✓" : "!"}
            </div>
            <div className="text-sm text-muted-foreground">
              {wordCount >= 100 ? "Good Length" : "Too Short"}
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Content Preview</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullText(!showFullText)}
              className="text-primary"
            >
              {showFullText ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Show All
                </>
              )}
            </Button>
          </div>

          <ScrollArea className={showFullText ? "h-64" : "h-32"}>
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {previewText}
              </pre>
            </div>
          </ScrollArea>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Content Quality</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Length</span>
              <span
                className={
                  wordCount >= 100 ? "text-green-600" : "text-yellow-600"
                }
              >
                {wordCount >= 100 ? "Optimal" : "Consider adding more content"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Structure</span>
              <span
                className={
                  extractedText.includes("\n")
                    ? "text-green-600"
                    : "text-yellow-600"
                }
              >
                {extractedText.includes("\n")
                  ? "Well structured"
                  : "Add paragraphs for better results"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expected Cards</span>
              <span className="text-primary font-medium">
                {estimatedCards} flashcards
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
