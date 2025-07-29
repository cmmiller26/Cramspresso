"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Settings, Zap, ArrowRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface GenerationConfig {
  difficulty: "beginner" | "intermediate" | "advanced";
  cardCount: number;
  focusAreas: string[];
  includeDefinitions: boolean;
  includeExamples: boolean;
  customPrompt?: string;
}

interface GenerationSettingsProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating?: boolean;
  estimatedCardCount: number;
}

export function GenerationSettings({
  onGenerate,
  isGenerating = false,
  estimatedCardCount,
}: GenerationSettingsProps) {
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [cardCount, setCardCount] = useState([
    Math.min(estimatedCardCount, 20),
  ]);
  const [includeDefinitions, setIncludeDefinitions] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = () => {
    const config: GenerationConfig = {
      difficulty,
      cardCount: cardCount[0],
      focusAreas: [], // Can be extended later
      includeDefinitions,
      includeExamples,
      customPrompt: customPrompt.trim() || undefined,
    };
    onGenerate(config);
  };

  const maxCards = Math.min(estimatedCardCount * 2, 50);

  return (
    <TooltipProvider>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Difficulty Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-foreground font-medium">
                Difficulty Level
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Beginner: Simple recall questions
                    <br />
                    Intermediate: Conceptual understanding
                    <br />
                    Advanced: Complex analysis and application
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={difficulty}
              onValueChange={(
                value: "beginner" | "intermediate" | "advanced"
              ) => setDifficulty(value)}
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <div className="space-y-1">
                    <Label htmlFor="beginner" className="text-sm font-medium">
                      Beginner
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Basic recall
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="intermediate"
                      className="text-sm font-medium"
                    >
                      Intermediate
                    </Label>
                    <p className="text-xs text-muted-foreground">Conceptual</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <div className="space-y-1">
                    <Label htmlFor="advanced" className="text-sm font-medium">
                      Advanced
                    </Label>
                    <p className="text-xs text-muted-foreground">Analytical</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Number of Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">
                Number of Cards
              </Label>
              <span className="text-sm font-medium text-primary">
                {cardCount[0]} cards
              </span>
            </div>
            <Slider
              value={cardCount}
              onValueChange={setCardCount}
              max={maxCards}
              min={5}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 cards</span>
              <span>{maxCards} cards (max)</span>
            </div>
          </div>

          {/* Content Options */}
          <div className="space-y-4">
            <Label className="text-foreground font-medium">
              Content Options
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="definitions" className="text-sm font-medium">
                    Include Definitions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add definition-based cards for key terms
                  </p>
                </div>
                <Switch
                  id="definitions"
                  checked={includeDefinitions}
                  onCheckedChange={setIncludeDefinitions}
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="examples" className="text-sm font-medium">
                    Include Examples
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Generate example-based questions
                  </p>
                </div>
                <Switch
                  id="examples"
                  checked={includeExamples}
                  onCheckedChange={setIncludeExamples}
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Settings
              </span>
              <span
                className={`transform transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
              <div className="space-y-2">
                <Label
                  htmlFor="custom-prompt"
                  className="text-foreground font-medium"
                >
                  Custom Instructions
                </Label>
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions for the AI (e.g., 'Focus on mathematical formulas', 'Include historical dates', etc.)"
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide specific guidance for flashcard generation
                </p>
              </div>
            </div>
          )}

          {/* Generation Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">
              Generation Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Difficulty:</span>
                <span className="ml-2 font-medium text-foreground capitalize">
                  {difficulty}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cards:</span>
                <span className="ml-2 font-medium text-foreground">
                  {cardCount[0]}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Definitions:</span>
                <span className="ml-2 font-medium text-foreground">
                  {includeDefinitions ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Examples:</span>
                <span className="ml-2 font-medium text-foreground">
                  {includeExamples ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate {cardCount[0]} Flashcards
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
