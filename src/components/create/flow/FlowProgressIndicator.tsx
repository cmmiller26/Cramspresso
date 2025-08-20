import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Zap, Eye } from "lucide-react";
import type { FlowProgressIndicatorProps } from "@/lib/types/components";
import type { FlowStep } from "@/lib/types/create";

interface StepConfig {
  step: FlowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const DEFAULT_STEPS: StepConfig[] = [
  {
    step: "upload",
    label: "Upload",
    icon: Upload,
    description: "Upload your content or paste text directly",
  },
  {
    step: "generating",
    label: "Generate",
    icon: Zap,
    description: "AI analyzes content and creates flashcards",
  },
  {
    step: "preview",
    label: "Preview",
    icon: Eye,
    description: "Review your flashcards and save your set",
  },
];

export function FlowProgressIndicator({
  currentStep,
  steps = DEFAULT_STEPS,
  showLabels = true,
  orientation = "horizontal",
  size = "md",
  className = "",
}: FlowProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.step === currentStep);

  if (orientation === "vertical") {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <StepIndicator
            key={step.step}
            label={step.label}
            icon={step.icon}
            description={step.description}
            isActive={index === currentStepIndex}
            isCompleted={index < currentStepIndex}
            showLabel={showLabels}
            size={size}
            orientation="vertical"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-${steps.length} gap-4 ${className}`}
    >
      {steps.map((step, index) => (
        <StepIndicator
          key={step.step}
          label={step.label}
          icon={step.icon}
          description={step.description}
          isActive={index === currentStepIndex}
          isCompleted={index < currentStepIndex}
          showLabel={showLabels}
          size={size}
          orientation="horizontal"
        />
      ))}
    </div>
  );
}

interface StepIndicatorProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
}

function StepIndicator({
  label,
  icon: Icon,
  description,
  isActive,
  isCompleted,
  showLabel = true,
  size = "md",
  orientation = "horizontal",
}: StepIndicatorProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const getStateClasses = () => {
    if (isActive) {
      return "bg-primary text-primary-foreground ring-2 ring-primary";
    }
    if (isCompleted) {
      return "bg-green-500 text-white";
    }
    return "bg-muted text-muted-foreground";
  };

  if (orientation === "vertical") {
    return (
      <div className="flex items-start gap-3">
        <div
          className={`
            ${sizeClasses[size]} 
            rounded-lg flex items-center justify-center 
            ${getStateClasses()}
          `}
        >
          <Icon className={iconSizeClasses[size]} />
        </div>
        {showLabel && (
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`text-center ${isActive ? "ring-2 ring-primary" : ""}`}>
      <CardContent className="p-4">
        <div
          className={`
            mx-auto ${sizeClasses[size]} 
            rounded-lg flex items-center justify-center mb-2 
            ${getStateClasses()}
          `}
        >
          <Icon className={iconSizeClasses[size]} />
        </div>
        {showLabel && (
          <>
            <p
              className={`text-sm font-medium ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </p>
            {description && size !== "sm" && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
