'use client';

import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layouts/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { coursesApi } from '@/features/courses/api/courses.api';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, Play, ChevronRight, CheckCircle, Lock, Clock, GraduationCap } from 'lucide-react';

const lessonTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Play className="h-4 w-4" />,
  READING: <BookOpen className="h-4 w-4" />,
  INTERACTIVE: <ChevronRight className="h-4 w-4" />,
  PRACTICE: <GraduationCap className="h-4 w-4" />,
};

const lessonTypeLabels: Record<string, string> = {
  VIDEO: 'Video',
  READING: 'Reading',
  INTERACTIVE: 'Interactive',
  PRACTICE: 'Practice',
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => coursesApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!course?.data) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">Course not found</h2>
            <p className="text-muted-foreground">The course you are looking for does not exist.</p>
            <Link href="/courses">
              <Button className="mt-4">Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const courseData = course.data;
  const progressData = progress?.data;
  const sections = courseData.sections || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-8">
          <div className="absolute right-0 top-0 h-64 w-64 opacity-10">
            <BookOpen className="h-full w-full" />
          </div>
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4">
              {courseData.level}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{courseData.title}</h1>
            <p className="mt-2 text-muted-foreground">
              {courseData.description || 'No description available'}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{sections.length} sections</span>
              <span>{courseData.totalLessons || 0} lessons</span>
              {progressData && (
                <span>{progressData.progress}% complete</span>
              )}
            </div>
            <div className="mt-6 flex gap-4">
              <Link href={`/courses/${courseId}/learn`}>
                <Button size="lg">
                  {progressData?.progress ? 'Continue Learning' : 'Start Learning'}
                </Button>
              </Link>
              {progressData && progressData.progress > 0 && (
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/courses/${courseId}/learn?restart=true`}>
                    Start Over
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progressData && progressData.totalLessons > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={progressData.progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progressData.completedLessons} of {progressData.totalLessons} lessons completed</span>
                  <span>{progressData.progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Course Content</h2>
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No content available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section: any, sectionIndex: number) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        Section {sectionIndex + 1}: {section.title}
                      </CardTitle>
                      <Badge variant="secondary">
                        {section.lessons?.length || 0} lessons
                      </Badge>
                    </div>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {section.lessons?.map((lesson: any, lessonIndex: number) => (
                        <Link
                          key={lesson.id}
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {lessonTypeIcons[lesson.type] || <BookOpen className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{lesson.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{lessonTypeLabels[lesson.type]}</span>
                              {lesson.estimatedTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.estimatedTime} min
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
