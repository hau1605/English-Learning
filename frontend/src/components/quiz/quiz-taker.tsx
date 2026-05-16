'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizzesApi, Quiz, QuizQuestion, QuizAnswer } from '@/features/quizzes/api/quizzes.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  AlertCircle,
} from 'lucide-react';

interface QuizTakerProps {
  quizId: string;
  onComplete?: (result: any) => void;
}

export function QuizTaker({ quizId, onComplete }: QuizTakerProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.getQuizById(quizId),
    enabled: !!quizId,
  });

  const quizData = quiz?.data;
  const questions = quizData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (quizData?.durationSeconds && !showResult) {
      setTimeRemaining(quizData.durationSeconds);
    }
  }, [quizData?.durationSeconds, showResult]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResult) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResult]);

  const handleSelectAnswer = useCallback((answerId: string, isMultiple: boolean) => {
    if (!currentQuestion) return;

    const current = selectedAnswers[currentQuestion.id] || [];

    if (isMultiple) {
      // Multiple choice - toggle selection
      if (current.includes(answerId)) {
        setSelectedAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: current.filter((id) => id !== answerId),
        }));
      } else {
        setSelectedAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: [...current, answerId],
        }));
      }
    } else {
      // Single choice - replace selection
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: [answerId],
      }));
    }
  }, [currentQuestion, selectedAnswers]);

  const handleSubmit = useCallback(async () => {
    if (!quizData) return;

    const answers = Object.entries(selectedAnswers).map(([questionId, answerIds]) => ({
      questionId,
      answerIds,
    }));

    try {
      const response = await quizzesApi.submitQuiz(quizId, answers);
      const resultData = response.data;
      setResult(resultData);
      setShowResult(true);
      toast.success(resultData.passed ? 'Congratulations! You passed!' : 'Keep practicing!');
      onComplete?.(resultData);
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  }, [quizData, selectedAnswers, quizId, onComplete]);

  const isAnswered = useCallback((questionId: string) => {
    return (selectedAnswers[questionId] || []).length > 0;
  }, [selectedAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  };

  const handleExit = () => {
    router.back();
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResult(false);
    setResult(null);
    if (quizData?.durationSeconds) {
      setTimeRemaining(quizData.durationSeconds);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Quiz not found</h2>
          <Button className="mt-4" onClick={handleExit}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Result Screen
  if (showResult && result) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              {result.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.score}%
              </div>
              <p className="text-muted-foreground mt-2">
                {result.passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{result.totalCorrect}</div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold">{result.totalQuestions}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">
                  {result.totalQuestions - result.totalCorrect}
                </div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>XP Earned</span>
                <span className="font-medium">+{result.xpEarned || 0}</span>
              </div>
              {result.timeSpent && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Time Spent</span>
                  <span>{formatTime(result.timeSpent)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleExit}>
                Exit
              </Button>
              <Button className="flex-1" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Taking Screen
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quizData.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>
        {timeRemaining !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-muted'
          }`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <Progress value={getProgress()} className="h-2" />

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q: QuizQuestion, index: number) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-10 h-10 rounded-full font-medium transition-colors ${
              index === currentQuestionIndex
                ? 'bg-primary text-primary-foreground'
                : isAnswered(q.id)
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">{currentQuestion?.question}</CardTitle>
            <Badge variant="outline">{currentQuestion?.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion?.answers.map((answer: QuizAnswer) => {
            const isSelected = (selectedAnswers[currentQuestion?.id] || []).includes(answer.id);
            const isMultiple = currentQuestion?.type === 'MULTIPLE_CHOICE';

            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(answer.id, isMultiple)}
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span>{answer.answer}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < totalQuestions}
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Exit Warning */}
      <div className="text-center">
        <Button variant="ghost" onClick={handleExit} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Exit Quiz
        </Button>
      </div>
    </div>
  );
}

export default QuizTaker;
