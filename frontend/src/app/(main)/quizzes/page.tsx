'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quizzesApi, Quiz } from '@/features/quizzes/api/quizzes.api';
import { QuizTaker } from '@/components/quiz/quiz-taker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Trophy, Filter, Search } from 'lucide-react';
import Link from 'next/link';

const QUIZ_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  FILL_BLANK: 'Fill in the Blank',
  MATCHING: 'Matching',
  SPEAKING: 'Speaking',
  MIXED: 'Mixed',
};

export default function QuizzesPage() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: quizzesData, isLoading } = useQuery({
    queryKey: ['quizzes', filter],
    queryFn: () => quizzesApi.getQuizzes(filter === 'all' ? undefined : { type: filter as any }),
  });

  const quizzes = quizzesData?.data || [];

  const filteredQuizzes = quizzes.filter((quiz: Quiz) => {
    if (!searchQuery) return true;
    return quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleQuizComplete = () => {
    setSelectedQuizId(null);
  };

  if (selectedQuizId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <QuizTaker quizId={selectedQuizId} onComplete={handleQuizComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-muted-foreground">
            Test your knowledge and earn XP rewards
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'MULTIPLE_CHOICE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('MULTIPLE_CHOICE')}
          >
            Multiple Choice
          </Button>
          <Button
            variant={filter === 'FILL_BLANK' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('FILL_BLANK')}
          >
            Fill in Blank
          </Button>
          <Button
            variant={filter === 'SPEAKING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('SPEAKING')}
          >
            Speaking
          </Button>
        </div>
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No quizzes found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz: Quiz) => (
            <Card
              key={quiz.id}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedQuizId(quiz.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {quiz.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {quiz.description || `${quiz._count?.questions || 0} questions`}
                    </p>
                  </div>
                  <ScrollText className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {QUIZ_TYPE_LABELS[quiz.type] || quiz.type}
                  </Badge>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{quiz._count?.questions || 0} questions</span>
                    <span className="text-green-600 font-medium">
                      Pass: {quiz.passingScore}%
                    </span>
                  </div>
                </div>
                {quiz.durationSeconds && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Time limit: {Math.floor(quiz.durationSeconds / 60)} minutes
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
