"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, Hash } from "lucide-react";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

interface Props {
  sets: SetItem[];
  loading: boolean;
  error: string | null;
}

export function SetGrid({ sets, loading, error }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Error loading sets: {error}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-semibold mb-2">No flashcard sets yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first set by uploading documents or starting from
            scratch.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push("/create")}>
              Upload & Generate
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Create Empty Set
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sets.map((set) => (
        <Card key={set.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Set Info */}
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                  {set.name}
                </h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Hash className="h-4 w-4" />
                  <span>
                    {set._count.cards}{" "}
                    {set._count.cards === 1 ? "card" : "cards"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* View Details - Primary Action */}
                <Button
                  onClick={() => router.push(`/sets/${set.id}`)}
                  className="flex-1"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>

                {/* Quick Study */}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/study/${set.id}`)}
                  disabled={set._count.cards === 0}
                  size="sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Study
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
