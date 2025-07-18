"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Hash, Clock } from "lucide-react";

interface Props {
  setName: string;
  cardCount: number;
  createdAt?: string;
  updatedAt?: string;
  loading?: boolean;
}

export function SetOverview({
  setName,
  cardCount,
  createdAt,
  updatedAt,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">{setName}</h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>
              {cardCount} {cardCount === 1 ? "card" : "cards"}
            </span>
          </div>
          {createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {updatedAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
