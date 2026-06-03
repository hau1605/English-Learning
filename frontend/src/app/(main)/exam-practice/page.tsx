'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  Flag,
  ListChecks,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Exam,
  examPracticeApi,
  PracticeAnswer,
  PracticeAttempt,
  PracticeSet,
} from '@/features/exam-practice/api/exam-practice.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils';

function getAnsweredCount(attempt?: PracticeAttempt | null) {
  if (!attempt) return 0;
  return attempt.answers.filter((answer) => answer.selectedOptionIds.length > 0 || answer.textAnswer).length;
}

function getCorrectOptionText(answer: PracticeAnswer) {
  const correctIds = answer.correctAnswerSnapshot?.selectedOptionIds || [];
  return answer.optionSnapshot
    .filter((option) => correctIds.includes(option.id))
    .map((option) => option.content)
    .join(', ');
}

function formatDuration(seconds?: number) {
  if (!seconds) return '0m';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

export default function ExamPracticePage() {
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string[]>>({});

  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['exam-practice', 'exams'],
    queryFn: examPracticeApi.getExams,
  });

  const exams = examsData?.data || [];
  const selectedExam = exams.find((exam) => exam.id === selectedExamId);
  const sections = selectedExam?.sections || [];

  const practiceQuery = useMemo(
    () => ({
      examId: selectedExamId === 'ALL' ? undefined : selectedExamId,
      sectionId: selectedSectionId === 'ALL' ? undefined : selectedSectionId,
      limit: 50,
    }),
    [selectedExamId, selectedSectionId],
  );

  const { data: setsData, isLoading: setsLoading } = useQuery({
    queryKey: ['exam-practice', 'practice-sets', practiceQuery],
    queryFn: () => examPracticeApi.getPracticeSets(practiceQuery),
  });

  const practiceSets = setsData?.data || [];
  const currentAnswer = attempt?.answers[currentIndex];
  const answeredCount = getAnsweredCount(attempt);
  const progress = attempt ? (answeredCount / Math.max(1, attempt.answers.length)) * 100 : 0;

  const startMutation = useMutation({
    mutationFn: examPracticeApi.startAttempt,
    onSuccess: (response) => {
      setAttempt(response.data);
      setCurrentIndex(0);
      setDraftAnswers(
        Object.fromEntries(response.data.answers.map((answer) => [answer.questionId, answer.selectedOptionIds])),
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Could not start this practice set');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (nextAnswers: Record<string, string[]>) => {
      if (!attempt) throw new Error('No active attempt');
      return examPracticeApi.saveAnswers(
        attempt.id,
        Object.entries(nextAnswers).map(([questionId, selectedOptionIds]) => ({
          questionId,
          selectedOptionIds,
        })),
      );
    },
    onSuccess: (response) => {
      setAttempt(response.data);
      toast.success('Answers saved');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!attempt) throw new Error('No active attempt');
      await examPracticeApi.saveAnswers(
        attempt.id,
        Object.entries(draftAnswers).map(([questionId, selectedOptionIds]) => ({
          questionId,
          selectedOptionIds,
        })),
      );
      return examPracticeApi.submitAttempt(attempt.id);
    },
    onSuccess: (response) => {
      setAttempt(response.data);
      toast.success('Practice submitted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Could not submit attempt');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (answer: PracticeAnswer) =>
      examPracticeApi.reportQuestion(answer.questionId, {
        reason: 'OTHER',
        message: 'Learner reported this question from the practice result page.',
      }),
    onSuccess: () => {
      toast.success('Question report sent');
    },
  });

  const chooseOption = (answer: PracticeAnswer, optionId: string) => {
    if (attempt?.status !== 'IN_PROGRESS') return;
    const isMultiple = answer.questionSnapshot.type === 'MULTIPLE_CHOICE';
    const existing = draftAnswers[answer.questionId] || [];
    const next = isMultiple
      ? existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId]
      : [optionId];

    setDraftAnswers((current) => ({
      ...current,
      [answer.questionId]: next,
    }));
  };

  if (attempt && currentAnswer) {
    const selectedIds = draftAnswers[currentAnswer.questionId] || currentAnswer.selectedOptionIds || [];
    const isSubmitted = attempt.status === 'SUBMITTED';

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button
              variant="ghost"
              className="mb-2 px-0"
              onClick={() => {
                setAttempt(null);
                setCurrentIndex(0);
                setDraftAnswers({});
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to practice sets
            </Button>
            <h1 className="text-3xl font-bold">{attempt.practiceSet.title}</h1>
            <p className="text-muted-foreground">
              Question {currentIndex + 1} of {attempt.answers.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isSubmitted ? 'success' : 'secondary'}>
              {attempt.status.replace('_', ' ')}
            </Badge>
            {attempt.practiceSet.recommendedMinutes && (
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {attempt.practiceSet.recommendedMinutes} min
              </Badge>
            )}
          </div>
        </div>

        {isSubmitted && (
          <Card>
            <CardContent className="grid gap-4 py-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-3xl font-bold">{attempt.scorePercent ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-3xl font-bold">{attempt.totalCorrect}/{attempt.totalQuestions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time spent</p>
                <p className="text-3xl font-bold">{formatDuration(attempt.timeSpentSeconds)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weak tags</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {attempt.analysis?.weakTags?.length ? (
                    attempt.analysis.weakTags.slice(0, 3).map((item) => (
                      <Badge key={item.tag} variant="outline">{item.tag}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Progress value={progress} />

        <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{currentAnswer.questionSnapshot.code}</Badge>
                {currentAnswer.questionSnapshot.topic && (
                  <Badge variant="secondary">{currentAnswer.questionSnapshot.topic}</Badge>
                )}
                {currentAnswer.questionSnapshot.knowledgeTags?.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentAnswer.questionSnapshot.passage && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <h2 className="mb-2 font-semibold">{currentAnswer.questionSnapshot.passage.title}</h2>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {currentAnswer.questionSnapshot.passage.content}
                  </p>
                </div>
              )}

              <div>
                <p className="whitespace-pre-wrap text-lg font-medium leading-7">
                  {currentAnswer.questionSnapshot.prompt}
                </p>
              </div>

              <div className="space-y-3">
                {currentAnswer.optionSnapshot.map((option) => {
                  const selected = selectedIds.includes(option.id);
                  const correct = currentAnswer.correctAnswerSnapshot.selectedOptionIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseOption(currentAnswer, option.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors',
                        selected && !isSubmitted && 'border-primary bg-primary/5',
                        isSubmitted && correct && 'border-green-500 bg-green-500/10',
                        isSubmitted && selected && !correct && 'border-destructive bg-destructive/10',
                        !isSubmitted && 'hover:bg-muted/60',
                      )}
                    >
                      {isSubmitted && correct ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                      ) : isSubmitted && selected && !correct ? (
                        <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
                      ) : (
                        <span className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs',
                          selected && 'border-primary bg-primary text-primary-foreground',
                        )}>
                          {selected ? '✓' : ''}
                        </span>
                      )}
                      <span>{option.content}</span>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="rounded-md border bg-muted/30 p-4">
                  <p className="text-sm font-semibold">
                    Correct answer: {getCorrectOptionText(currentAnswer)}
                  </p>
                  {currentAnswer.explanationSnapshot && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {currentAnswer.explanationSnapshot}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => reportMutation.mutate(currentAnswer)}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Report issue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question map</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {attempt.answers.map((answer, index) => {
                  const selected = draftAnswers[answer.questionId] || answer.selectedOptionIds || [];
                  const answered = selected.length > 0 || answer.textAnswer;
                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        'h-10 rounded-md border text-sm font-medium',
                        index === currentIndex && 'border-primary bg-primary text-primary-foreground',
                        index !== currentIndex && answered && 'bg-muted',
                        isSubmitted && answer.isCorrect === true && 'border-green-500',
                        isSubmitted && answer.isCorrect === false && 'border-destructive',
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={currentIndex >= attempt.answers.length - 1}
                  onClick={() => setCurrentIndex((value) => Math.min(attempt.answers.length - 1, value + 1))}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {!isSubmitted && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => saveMutation.mutate(draftAnswers)}
                    disabled={saveMutation.isPending}
                  >
                    Save answers
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const unanswered = attempt.answers.length - Object.keys(draftAnswers).filter((id) => draftAnswers[id]?.length).length;
                      if (unanswered > 0 && !confirm(`You still have ${unanswered} unanswered question(s). Submit anyway?`)) return;
                      submitMutation.mutate();
                    }}
                    disabled={submitMutation.isPending}
                  >
                    Submit practice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FileQuestion className="h-8 w-8" />
            Exam Practice
          </h1>
          <p className="mt-1 text-muted-foreground">
            Start with TOEIC Reading practice sets, then review mistakes and explanations.
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-[1fr_1fr_auto]">
        <Select
          value={selectedExamId}
          onValueChange={(value) => {
            setSelectedExamId(value);
            setSelectedSectionId('ALL');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All exams</SelectItem>
            {exams.map((exam: Exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
          <SelectTrigger>
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setSelectedExamId('ALL');
            setSelectedSectionId('ALL');
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {examsLoading || setsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-md" />
          ))}
        </div>
      ) : practiceSets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">No published practice sets yet</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                The TOEIC Reading catalog is ready, but real question content must be entered by an admin or teacher before learners can practice.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {practiceSets.map((set: PracticeSet) => (
            <Card key={set.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{set.title}</CardTitle>
                  <Badge variant="secondary">{set.difficulty.replace('_', ' ')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {set.description || 'Practice set'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {set.section?.partNumber && <Badge variant="outline">Part {set.section.partNumber}</Badge>}
                  <Badge variant="outline">
                    <ListChecks className="mr-1 h-3 w-3" />
                    {set._count?.questions || 0} questions
                  </Badge>
                  {set.recommendedMinutes && (
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {set.recommendedMinutes} min
                    </Badge>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => startMutation.mutate(set.id)}
                  disabled={startMutation.isPending || !set._count?.questions}
                >
                  Start practice
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
