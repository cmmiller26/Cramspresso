"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  overlay?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
  overlay = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        overlay && "min-h-[200px]",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <p
          className={cn(
            "text-muted-foreground animate-pulse font-medium",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Button loading spinner variant
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({
  isLoading,
  children,
  className,
}: ButtonLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </div>
  );
}

// Inline loading spinner for specific sections
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{text || "Loading..."}</span>
    </div>
  );
}
