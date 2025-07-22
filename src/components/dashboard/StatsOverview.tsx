"use client";

import { BookOpen, CreditCard, TrendingUp } from "lucide-react";
import { StatsOverviewSkeleton } from "@/components/shared/SkeletonLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsOverviewError } from "../shared/ErrorStates";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

interface StatsOverviewProps {
  sets: SetItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function StatsOverview({
  sets,
  loading = false,
  error,
  onRetry,
}: StatsOverviewProps) {
  if (loading) return <StatsOverviewSkeleton />;

  if (error) return <StatsOverviewError onRetry={onRetry} />;

  const totalSets = sets.length;
  const totalCards = sets.reduce((sum, set) => sum + set._count.cards, 0);
  const avgCardsPerSet = totalSets > 0 ? Math.round(totalCards / totalSets) : 0;

  const stats = [
    {
      title: "Total Sets",
      value: totalSets,
      icon: BookOpen,
      description: "Flashcard sets created",
    },
    {
      title: "Total Cards",
      value: totalCards,
      icon: CreditCard,
      description: "Cards across all sets",
    },
    {
      title: "Average per Set",
      value: avgCardsPerSet,
      icon: TrendingUp,
      description: "Cards per set",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
