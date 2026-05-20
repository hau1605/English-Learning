'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layouts/main-layout';
import { useCurrentUser } from '@/features/auth/hooks/use-auth.hook';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, GraduationCap, ScrollText, Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { flashcardsApi } from '@/features/flashcards/api/flashcards.api';
import { analyticsApi } from '@/features/analytics/api/analytics.api';
import {
  StreakCalendar,
  AchievementsShowcase,
  XpProgressWidget,
  RecommendedLessons,
  WeeklyActivityWidget,
} from '@/components/dashboard/widgets';
import { useXpSocket, useStreakSocket, useAchievementSocket } from '@/hooks/use-socket.hook';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useAuthStore();
  const { data: flashcardStats } = useQuery({
    queryKey: ['flashcards', 'stats'],
    queryFn: flashcardsApi.getStats,
  });
  const { data: leaderboard } = useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(),
  });

  // Real-time XP updates
  useXpSocket((data) => {
    toast.success(`+${data.xp} XP from ${data.source}!`, {
      icon: '⭐',
    });
  });

  // Real-time streak updates
  useStreakSocket((data) => {
    toast.info(`Your streak is now ${data.streakDays} days!`, {
      icon: '🔥',
    });
  });

  // Real-time achievement unlocks
  useAchievementSocket((achievement) => {
    toast.success(`Achievement Unlocked: ${achievement.name}!`, {
      icon: achievement.icon,
      duration: 5000,
    });
  });

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Learner'}!
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your English learning journey?
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">Settings</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {user?.level || 1}</div>
            <p className="text-xs text-muted-foreground">
              {user?.xp || 0} XP total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.streakDays || 0} days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Cards</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flashcardStats?.data?.dueCards || 0}</div>
            <Link href="/flashcards" className="text-xs text-primary hover:underline">
              Start reviewing
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mastered</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flashcardStats?.data?.masteredCards || 0}</div>
            <p className="text-xs text-muted-foreground">
              Cards with 21+ day interval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Widgets Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StreakCalendar currentStreak={user?.streakDays || 0} />
        <XpProgressWidget currentXp={user?.xp || 0} level={user?.level || 1} />
        <WeeklyActivityWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/flashcards">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Review Flashcards
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {flashcardStats?.data?.dueCards || 0} cards due for review.
                Keep your streak alive!
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vocabulary">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learn Vocabulary
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore new words and expand your vocabulary.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quizzes">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Take a Quiz
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test your knowledge and earn XP rewards.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Achievements */}
        <AchievementsShowcase />

        {/* Recommended Lessons */}
        <RecommendedLessons />

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Learners
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/leaderboard">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard?.data?.slice(0, 5).map((entry: any, index: number) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      'bg-muted'
                    }`}>
                      <span className="text-xs font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.fullName}</p>
                      <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                    </div>
                  </div>
                  <Badge variant={index < 3 ? 'default' : 'secondary'} className="text-xs">
                    {entry.xp} XP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
