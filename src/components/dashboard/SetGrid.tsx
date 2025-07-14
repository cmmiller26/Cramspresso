"use client";

import { useState, useMemo } from "react";
import { SetCard } from "./SetCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SetItem {
  id: string;
  name: string;
  _count: { cards: number };
}

interface SetGridProps {
  sets: SetItem[];
  loading: boolean;
  error: string | null;
}

export function SetGrid({ sets, loading, error }: SetGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSets = useMemo(() => {
    if (!searchTerm.trim()) return sets;
    return sets.filter((set) =>
      set.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sets, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No flashcard sets yet</h3>
        <p className="text-muted-foreground">
          Create your first set to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your sets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results */}
      {filteredSets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No sets found matching &ldquo;{searchTerm}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
        </div>
      )}
    </div>
  );
}
