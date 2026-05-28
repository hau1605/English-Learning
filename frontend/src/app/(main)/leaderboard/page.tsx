"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  analyticsApi,
  type LeaderboardEntry,
} from "@/features/analytics/api/analytics.api";
import { Trophy, TrendingUp, Flame, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket.hook";

export default function LeaderboardPage() {
  const [mounted, setMounted] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<
    "global" | "weekly" | "monthly"
  >("global");

  const {
    data: leaderboard,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["analytics", "leaderboard", leaderboardType],
    queryFn: () => analyticsApi.getLeaderboard(leaderboardType),
    refetchInterval: 60000, // Refetch every minute
  });

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("leaderboard:update", () => {
        refetch();
      });

      return () => {
        socket.off("leaderboard:update");
      };
    }
  }, [socket, isConnected, refetch]);

  const leaderboardData = leaderboard?.data || [];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            See how you rank among other learners
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}
            />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          {/* Type Selector */}
          <SearchableSelect
            value={leaderboardType}
            onValueChange={(value) =>
              setLeaderboardType(value as "global" | "weekly" | "monthly")
            }
            className="w-[180px]"
            options={[
              { value: "global", label: "Global Ranking" },
              { value: "weekly", label: "This Week" },
              { value: "monthly", label: "This Month" },
            ]}
          />

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <div className="flex justify-center items-end gap-4 pb-8">
          {[1, 0, 2].map((index) => {
            const entry = leaderboardData[index];
            if (!entry) return null;

            const podiumHeight =
              index === 1 ? "h-48" : index === 0 ? "h-36" : "h-28";
            const podiumOrder = index === 1 ? 2 : index === 0 ? 1 : 3;
            const podiumColors = [
              "from-yellow-400 to-yellow-600",
              "from-gray-300 to-gray-500",
              "from-amber-600 to-amber-800",
            ];

            return (
              <div
                key={entry.rank}
                className="text-center flex flex-col items-center"
              >
                {/* Avatar */}
                <div className="relative mb-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {entry.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  {podiumOrder === 1 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Level */}
                <p className="font-semibold text-sm max-w-[100px] truncate">
                  {entry.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Level {entry.level}
                </p>

                {/* XP Badge */}
                <Badge
                  variant={index === 0 ? "default" : "secondary"}
                  className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
                >
                  {entry.xp.toLocaleString()} XP
                </Badge>

                {/* Podium */}
                <div
                  className={`w-24 rounded-t-lg flex items-center justify-center mt-3 bg-gradient-to-b ${podiumColors[index]}`}
                  style={{
                    height:
                      podiumHeight === "h-48"
                        ? "192px"
                        : podiumHeight === "h-36"
                          ? "144px"
                          : "112px",
                  }}
                >
                  <span className="text-white text-4xl font-bold opacity-50">
                    #{index + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Rankings</span>
            <span className="text-sm font-normal text-muted-foreground">
              {leaderboardData.length} learners
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No rankings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start learning to appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData
                .slice(3)
                .map((entry: LeaderboardEntry, index: number) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
                        <span className="text-sm font-bold text-muted-foreground">
                          #{index + 4}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                        {entry.fullName?.charAt(0)?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div>
                        <p className="font-medium">{entry.fullName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            Level {entry.level}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {entry.streakDays} days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      {/* Streak */}
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {entry.streakDays}
                        </span>
                      </div>

                      {/* XP */}
                      <Badge variant="secondary" className="font-medium">
                        {entry.xp.toLocaleString()} XP
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
