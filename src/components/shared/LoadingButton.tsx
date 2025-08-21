"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: ((event?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>) | (() => void | Promise<void>);
  disabled?: boolean;
  className?: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  children,
  onClick,
  disabled,
  className,
  variant = "default",
  size = "default",
  loadingText,
}: LoadingButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled || !onClick) return;

    // Check if the function expects parameters by checking its length
    const expectsParams = onClick.length > 0;
    
    // If onClick is async, manage loading state internally
    if (onClick.constructor.name === "AsyncFunction") {
      setInternalLoading(true);
      try {
        if (expectsParams) {
          await onClick(event);
        } else {
          await (onClick as () => Promise<void>)();
        }
      } finally {
        setInternalLoading(false);
      }
    } else {
      if (expectsParams) {
        (onClick as (event: React.MouseEvent<HTMLButtonElement>) => void)(event);
      } else {
        (onClick as () => void)();
      }
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
