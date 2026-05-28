"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUserEngagementReport,
  useQuizPerformanceReport,
  useLearningProgressReport,
  useExportUserData,
} from "@/features/admin/hooks/use-admin.hook";
import {
  Download,
  Users,
  BookOpen,
  Brain,
  ScrollText,
  TrendingUp,
  Activity,
  Trophy,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useState as useStateEffect } from "react";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
const chartContainerClass = "h-64 min-h-64 w-full min-w-0 sm:h-72";

export default function AdminReportsPage() {
  const [mounted, setMounted] = useStateEffect(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: engagement, isLoading: engagementLoading } =
    useUserEngagementReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

  const { data: quizPerformance, isLoading: quizLoading } =
    useQuizPerformanceReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

  const { data: learningProgress, isLoading: progressLoading } =
    useLearningProgressReport();
  const exportMutation = useExportUserData();

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Prepare chart data
  const engagementChartData =
    engagement?.data?.dailyStats?.map((stat: any) => ({
      date: new Date(stat.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      words: stat.learnedWords,
      flashcards: stat.flashcardsReviewed,
      quizzes: stat.quizzesCompleted,
      xp: stat.xpEarned,
    })) || [];

  const quizScoreData =
    quizPerformance?.data?.quizStats?.map((stat: any) => ({
      name: stat.quiz?.title?.substring(0, 15) || "Quiz",
      avgScore: Math.round(stat._avg?.score || 0),
      attempts: stat._count,
    })) || [];

  const difficultyData =
    learningProgress?.data?.vocabularyByDifficulty?.map((d: any) => ({
      name:
        ["Easy", "Medium", "Hard", "Very Hard", "Expert"][d.difficulty - 1] ||
        `Level ${d.difficulty}`,
      value: d._count,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed analytics and reports for your platform
          </p>
        </div>
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row items-end">
            <div className="grid gap-2 flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2 flex-1">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Performance</TabsTrigger>
          <TabsTrigger value="progress">Learning Progress</TabsTrigger>
        </TabsList>

        {/* User Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagement?.data?.activeUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Words Learned
                </CardTitle>
                <BookOpen className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagement?.data?.totals?.learnedWords || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg:{" "}
                  {Math.round(engagement?.data?.averages?.learnedWords || 0)}
                  /day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flashcards Reviewed
                </CardTitle>
                <Brain className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagement?.data?.totals?.flashcardsReviewed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg:{" "}
                  {Math.round(
                    engagement?.data?.averages?.flashcardsReviewed || 0,
                  )}
                  /day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total XP
                </CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagement?.data?.totals?.xpEarned || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Daily Learning Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={chartContainerClass}>
                  <ResponsiveContainer
                    width="100%"
                    height={288}
                    minWidth={0}
                    minHeight={240}
                  >
                    <LineChart data={engagementChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="words"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="flashcards"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">XP Earned Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={chartContainerClass}>
                  <ResponsiveContainer
                    width="100%"
                    height={288}
                    minWidth={0}
                    minHeight={240}
                  >
                    <BarChart data={engagementChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="xp" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quiz Performance Tab */}
        <TabsContent value="quiz" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Attempts
                </CardTitle>
                <ScrollText className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {quizPerformance?.data?.overallStats?.totalAttempts || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    quizPerformance?.data?.overallStats?.averageScore || 0,
                  )}
                  %
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pass Rate
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    quizPerformance?.data?.overallStats?.passRate || 0,
                  )}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Quiz Performance by Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={chartContainerClass}>
                <ResponsiveContainer
                  width="100%"
                  height={288}
                  minWidth={0}
                  minHeight={240}
                >
                  <BarChart data={quizScoreData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      className="text-xs"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      className="text-xs"
                    />
                    <Tooltip />
                    <Bar
                      dataKey="avgScore"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningProgress?.data?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Reviewers
                </CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningProgress?.data?.flashcardEngagement
                    ?.totalReviewers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Cards/User
                </CardTitle>
                <Brain className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    learningProgress?.data?.flashcardEngagement
                      ?.averageCardsPerUser || 0,
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Learner XP
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningProgress?.data?.topUsers?.[0]?.xp || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Vocabulary by Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={chartContainerClass}>
                  <ResponsiveContainer
                    width="100%"
                    height={288}
                    minWidth={0}
                    minHeight={240}
                  >
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent = 0 }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {difficultyData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Learners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningProgress?.data?.topUsers
                    ?.slice(0, 5)
                    .map((user: any, index: number) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                  ? "bg-gray-400"
                                  : index === 2
                                    ? "bg-amber-600"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              Level {user.level}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {user.xp.toLocaleString()} XP
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.streakDays} day streak
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
