import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-80 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Process overview skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="text-center">
              <Skeleton className="mx-auto w-12 h-12 rounded-lg mb-2" />
              <Skeleton className="h-5 w-20 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Main upload area skeleton */}
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/30">
            <Skeleton className="mx-auto w-12 h-12 mb-4" />
            <Skeleton className="h-6 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <Skeleton className="h-10 w-32 mx-auto mb-4" />
            <Skeleton className="h-3 w-56 mx-auto" />
          </div>

          {/* Text input area skeleton */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <Skeleton className="h-3 w-24 bg-background" />
              </div>
            </div>

            <div className="mt-6">
              <Skeleton className="w-full h-32 mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips section skeleton */}
      <Card className="mt-8 bg-muted/50 border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
