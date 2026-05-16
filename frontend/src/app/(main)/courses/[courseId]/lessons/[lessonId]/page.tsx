'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { coursesApi, Lesson } from '@/features/courses/api/courses.api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Play, BookOpen, CheckCircle, ChevronLeft } from 'lucide-react';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => coursesApi.getLesson('', lessonId),
    enabled: !!lessonId,
  });

  const markViewedMutation = useMutation({
    mutationFn: (id: string) => coursesApi.markLessonViewed(id),
    onSuccess: () => {
      setIsCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
  });

  useEffect(() => {
    if (lesson?.data && !isCompleted) {
      markViewedMutation.mutate(lessonId);
    }
  }, [lesson?.data, lessonId]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!lesson?.data) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">Lesson not found</h2>
            <p className="text-muted-foreground">The lesson you are looking for does not exist.</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const lessonData = lesson.data as Lesson;

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
                <Play className="h-16 w-16 text-white/50" />
              </div>
            )}
          </div>
        );

      case 'READING':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: lessonData.content || '' }} />
          </div>
        );

      case 'INTERACTIVE':
        return (
          <div className="space-y-4">
            <p>{lessonData.description}</p>
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
            <Button className="w-full" size="lg">
              Start Practice
            </Button>
          </div>
        );

      default:
        return (
          <div dangerouslySetInnerHTML={{ __html: lessonData.content || '' }} />
        );
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/courses/${courseId}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{lessonData.type.toLowerCase()} Lesson</span>
                {lessonData.estimatedTime && (
                  <>
                    <span>•</span>
                    <span>{lessonData.estimatedTime} min</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {isCompleted && (
            <Badge variant="default" className="gap-1 bg-green-500">
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

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/courses/${courseId}`}>
              Next Lesson
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variant === 'default' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} ${className}`}>
      {children}
    </span>
  );
}
