'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  _count?: { vocabularies: number };
}

interface Vocabulary {
  id: string;
  word: string;
  pronunciation?: string;
  meaning: string;
  example?: string;
  difficulty: number;
}

export default function VocabularyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['vocabulary', 'topics'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Topic[]>>('/vocabulary/topics');
      return response.data.data;
    },
  });

  const { data: topicVocab, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary', 'topic', selectedTopic],
    queryFn: async () => {
      const slug = topics?.find((t: Topic) => t.id === selectedTopic)?.slug;
      if (!slug) return null;
      const response = await api.get<ApiResponse<Topic & { vocabularies: Vocabulary[] }>>(
        `/vocabulary/topics/${slug}`
      );
      return response.data.data;
    },
    enabled: !!selectedTopic,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['vocabulary', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const response = await api.get<ApiResponse<Vocabulary[]>>('/vocabulary/search', {
        params: { q: searchQuery },
      });
      return response.data.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const isLoading = topicsLoading || (selectedTopic && vocabLoading);

  const displayData = searchQuery.length >= 2
    ? searchResults
    : selectedTopic
      ? topicVocab?.vocabularies
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vocabulary</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vocabulary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Topics Grid */}
      {!selectedTopic && searchQuery.length < 2 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
          ) : (
            topics?.map((topic: Topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedTopic(topic.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{topic.icon || '📚'}</span>
                      {topic.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {topic._count?.vocabularies || 0} words
                    </Badge>
                  </div>
                </CardHeader>
                {topic.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Vocabulary List */}
      {(selectedTopic || searchQuery.length >= 2) && displayData && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {selectedTopic && (
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-sm text-primary hover:underline"
              >
                ← Back to topics
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {selectedTopic ? topicVocab?.name : 'Search Results'}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(displayData as Vocabulary[]).map((vocab: Vocabulary) => (
              <Card key={vocab.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{vocab.word}</CardTitle>
                  {vocab.pronunciation && (
                    <p className="text-sm text-muted-foreground">/{vocab.pronunciation}/</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-primary">{vocab.meaning}</p>
                  {vocab.example && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      &quot;{vocab.example}&quot;
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Level {vocab.difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(!displayData || (Array.isArray(displayData) && displayData.length === 0)) &&
        !isLoading && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery.length >= 2
                  ? 'No vocabulary found matching your search'
                  : 'Select a topic to view vocabulary'}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
