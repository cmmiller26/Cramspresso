"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

interface SetCardProps {
  set: SetItem;
}

export function SetCard({ set }: SetCardProps) {
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
            <Button className="w-full">View & Edit</Button>
          </Link>
          {cardCount > 0 && (
            <Link href={`/study/${set.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                Study Now
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
