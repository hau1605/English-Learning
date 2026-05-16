'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { coursesApi } from '@/features/courses/api/courses.api';
import { Trophy, Star, TrendingUp, Target, Zap, Award } from 'lucide-react';
import Link from 'next/link';

interface StreakCalendarProps {
  userId?: string;
  currentStreak?: number;
}

export function StreakCalendar({ currentStreak = 0 }: StreakCalendarProps) {
  // Generate last 30 days
  const days: { date: Date; active: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Simulate activity (in real app, fetch from API)
    days.push({
      date,
      active: Math.random() > 0.3, // Simulated
    });
  }

  const getMonthLabel = (index: number) => {
    if (index === 0 || days[index].date.getDate() === 1) {
      return days[index].date.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Current Streak
          </CardTitle>
          <Badge variant="outline" className="text-orange-500 border-orange-200">
            {currentStreak} days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 flex-wrap">
          {days.map((day, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-sm ${
                day.active
                  ? 'bg-orange-500'
                  : day.date.toDateString() === new Date().toDateString()
                  ? 'border-2 border-primary'
                  : 'bg-gray-100'
              }`}
              title={day.date.toLocaleDateString()}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementsShowcase() {
  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      // In real app, call API
      return {
        achievements: [
          { id: '1', name: 'First Steps', icon: '🎯', progress: 100, isUnlocked: true },
          { id: '2', name: 'Week Warrior', icon: '🔥', progress: 100, isUnlocked: true },
          { id: '3', name: 'Quiz Master', icon: '📝', progress: 60, isUnlocked: false },
        ],
      };
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Recent Achievements
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/achievements">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievementsData?.achievements?.map((achievement: any) => (
          <div key={achievement.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
              {achievement.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{achievement.name}</p>
              {!achievement.isUnlocked && (
                <Progress value={achievement.progress} className="h-1 mt-1" />
              )}
            </div>
            {achievement.isUnlocked && (
              <Badge variant="secondary" className="text-xs">Unlocked</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function XpProgressWidget({ currentXp = 0, level = 1 }: { currentXp?: number; level?: number }) {
  // Calculate XP needed for next level (simplified formula)
  const xpForNextLevel = Math.floor(100 * Math.pow(1.2, level));
  const xpForCurrentLevel = Math.floor(100 * Math.pow(1.2, level - 1));
  const progress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Level {level}
          </CardTitle>
          <Badge variant="outline">{currentXp} XP</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={Math.min(100, progress)} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentXp - xpForCurrentLevel} XP</span>
            <span>{xpForNextLevel - xpForCurrentLevel} XP to next level</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecommendedLessons() {
  const { data: courses } = useQuery({
    queryKey: ['courses', 'recommended'],
    queryFn: () => coursesApi.getPublishedCourses(),
  });

  const recommendedCourses = courses?.data?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Continue Learning
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">Browse All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendedCourses.map((course: any) => (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{course.title}</p>
              <p className="text-xs text-muted-foreground">
                {course.totalLessons || 0} lessons
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        {recommendedCourses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recommended courses yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyActivityWidget() {
  // Generate weekly data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  const data = days.map((day, index) => ({
    day,
    xp: Math.floor(Math.random() * 100),
    isToday: index === today,
  }));
  const maxXp = Math.max(...data.map(d => d.xp));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-24">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${
                  item.isToday ? 'bg-primary' : 'bg-muted'
                }`}
                style={{
                  height: `${Math.max(4, (item.xp / maxXp) * 100)}%`,
                }}
              />
              <span className="text-xs text-muted-foreground">{item.day}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Total: {data.reduce((sum, d) => sum + d.xp, 0)} XP</span>
          <span>Avg: {Math.round(data.reduce((sum, d) => sum + d.xp, 0) / 7)} XP/day</span>
        </div>
      </CardContent>
    </Card>
  );
}
