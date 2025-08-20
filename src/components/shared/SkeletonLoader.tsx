import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circular";
}

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variant === "default" && "rounded-md",
        variant === "rounded" && "rounded-lg",
        variant === "circular" && "rounded-full",
        className
      )}
    />
  );
}

// Dashboard Skeletons
export function StatsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8" variant="circular" />
          </div>
          <Skeleton className="h-8 w-16 mt-2" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
      ))}
    </div>
  );
}

// Study Mode Skeletons
export function StudyCardSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card skeleton */}
      <div className="h-[400px] mb-6">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 h-full flex flex-col justify-center items-center text-center">
          <Skeleton className="h-4 w-20 mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-4/5 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="h-[120px] flex items-center justify-center">
        <div className="w-full max-w-md mx-auto text-center">
          <Skeleton className="h-4 w-48 mx-auto mb-3" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudyProgressSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="space-y-3">
        {/* Progress header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Session totals */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Flow Skeletons
export function GeneratedCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-6" variant="circular" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <div className="border-t border-border pt-3 mt-3">
        <Skeleton className="h-4 w-12 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function CardReviewSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="space-y-4 mb-8">
        {Array.from({ length: count }).map((_, i) => (
          <GeneratedCardSkeleton key={i} />
        ))}
      </div>

      {/* Save section skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex gap-2 justify-end">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page-level skeleton wrapper
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </div>
  );
}
