import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-8 w-96 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded" />
        </div>

        {/* Cards skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader>
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-16 w-full bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-12 w-full bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
