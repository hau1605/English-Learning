'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface GrammarCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: { lessons: number };
}

interface GrammarLesson {
  id: string;
  title: string;
  slug: string;
  difficulty: number;
}

export default function GrammarPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['grammar', 'categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<GrammarCategory[]>>('/grammar/categories');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grammar</h1>
        <p className="text-muted-foreground">
          Master English grammar with structured lessons
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories?.map((category: GrammarCategory) => (
          <Card key={category.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>{category.name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {category._count?.lessons || 0} lessons
                </Badge>
              </div>
            </CardHeader>
            {category.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No grammar categories available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
