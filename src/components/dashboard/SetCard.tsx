"use client";

import { memo } from "react";
import Link from "next/link";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, BookOpen } from "lucide-react";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

interface SetCardProps {
  set: SetItem;
}

export const SetCard = memo(function SetCard({ set }: SetCardProps) {
  const cardCount = set._count.cards;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{set.name}</CardTitle>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {cardCount} {cardCount === 1 ? "card" : "cards"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Link href={`/sets/${set.id}`} className="w-full">
            <LoadingButton className="w-full" loadingText="Loading...">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </LoadingButton>
          </Link>
          {cardCount > 0 && (
            <Link href={`/study/${set.id}`} className="w-full">
              <LoadingButton variant="outline" className="w-full" loadingText="Starting...">
                <BookOpen className="h-4 w-4 mr-2" />
                Study Now
              </LoadingButton>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
