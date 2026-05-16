import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';

export function useCourses(params?: Parameters<typeof coursesApi.getCourses>[0]) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.getCourses(params),
  });
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => coursesApi.getPublishedCourses(),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => coursesApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });
}

export function useCourseSections(courseId: string) {
  return useQuery({
    queryKey: ['course-sections', courseId],
    queryFn: () => coursesApi.getCourseSections(courseId),
    enabled: !!courseId,
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => coursesApi.getLesson('', lessonId),
    enabled: !!lessonId,
  });
}
