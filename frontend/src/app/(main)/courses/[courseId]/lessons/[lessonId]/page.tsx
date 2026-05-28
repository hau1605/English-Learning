'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { coursesApi, Lesson } from '@/features/courses/api/courses.api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Play, BookOpen, CheckCircle, ChevronLeft, Clock, FileText } from 'lucide-react';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const [isCompleted, setIsCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => coursesApi.getLesson(courseId, lessonId),
    enabled: !!lessonId && !!courseId,
  });

  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => coursesApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });

  const markViewedMutation = useMutation({
    mutationFn: (id: string) => coursesApi.markLessonViewed(id),
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
  });

  useEffect(() => {
    if (lesson?.data && !isCompleted && mounted) {
      markViewedMutation.mutate(lessonId);
    }
  }, [lesson?.data, lessonId, isCompleted, mounted]);

  // Get next lesson info from progress
  const nextLessonId = courseProgress?.data?.nextLesson?.id;
  const previousLessonId = courseProgress?.data?.previousLesson?.id;

  if (!mounted || isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!lesson?.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h2 className="text-lg font-semibold">Lesson not found</h2>
          <p className="text-muted-foreground">The lesson you are looking for does not exist.</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lessonData = lesson.data as Lesson;

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Play className="h-4 w-4" />;
      case 'READING':
        return <FileText className="h-4 w-4" />;
      case 'INTERACTIVE':
      case 'PRACTICE':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderLessonContent = () => {
    switch (lessonData.type) {
      case 'VIDEO':
        return (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {lessonData.videoUrl ? (
              <video
                src={lessonData.videoUrl}
                controls
                className="h-full w-full"
                onEnded={() => markViewedMutation.mutate(lessonId)}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Play className="h-16 w-16 text-white/50 mx-auto" />
                  <p className="text-white/50 mt-4">No video available</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'READING':
        return (
          <div className="prose dark:prose-invert max-w-none">
            {lessonData.content ? (
              <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
            ) : (
              <p className="text-muted-foreground">No content available for this lesson.</p>
            )}
          </div>
        );

      case 'INTERACTIVE':
        return (
          <div className="space-y-4">
            {lessonData.description && (
              <p className="text-lg">{lessonData.description}</p>
            )}
            {lessonData.content && (
              <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
            )}
          </div>
        );

      case 'PRACTICE':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">{lessonData.description}</p>
            {lessonData.content && (
              <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
            )}
            <Button className="w-full" size="lg" asChild>
              <Link href={`/quizzes?lesson=${lessonId}`}>
                Start Practice
              </Link>
            </Button>
          </div>
        );

      default:
        return lessonData.content ? (
          <div dangerouslySetInnerHTML={{ __html: lessonData.content }} />
        ) : (
          <p className="text-muted-foreground">No content available.</p>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              {getLessonTypeIcon(lessonData.type)}
              <span className="capitalize">{lessonData.type.toLowerCase()}</span>
            </Badge>
            {lessonData.estimatedTime && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {lessonData.estimatedTime} min
              </span>
            )}
          </div>
        </div>
        {isCompleted && (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-4 w-4" />
            Completed
          </Badge>
        )}
      </div>

      {/* Lesson Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{lessonData.title}</h1>
        {lessonData.description && (
          <p className="mt-2 text-muted-foreground">{lessonData.description}</p>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderLessonContent()}
        </CardContent>
      </Card>

      {/* Progress indicator */}
      {courseProgress?.data && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Your progress: {courseProgress.data.completedLessons || 0} / {courseProgress.data.totalLessons || 0} lessons
              </span>
              <span className="font-medium">
                {Math.round(((courseProgress.data.completedLessons || 0) / Math.max(courseProgress.data.totalLessons || 1, 1)) * 100)}% complete
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.round(((courseProgress.data.completedLessons || 0) / Math.max(courseProgress.data.totalLessons || 1, 1)) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {previousLessonId ? (
          <Button variant="outline" asChild>
            <Link href={`/courses/${courseId}/lessons/${previousLessonId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>
        )}
        {nextLessonId ? (
          <Button asChild>
            <Link href={`/courses/${courseId}/lessons/${nextLessonId}`}>
              Next Lesson
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/courses/${courseId}`}>
              Back to Course
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
