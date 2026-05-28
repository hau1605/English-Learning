'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi } from '@/features/flashcards/api/flashcards.api';
import { useFlashcardSessionStore } from '@/stores/flashcard-session.store';
import { toast } from 'sonner';

export function useDueFlashcards(limit?: number) {
  return useQuery({
    queryKey: ['flashcards', 'due', limit],
    queryFn: () => flashcardsApi.getDueCards(limit),
  });
}

export function useAllFlashcards(topicId?: string) {
  return useQuery({
    queryKey: ['flashcards', 'all', topicId],
    queryFn: () => flashcardsApi.getAllFlashcards(topicId),
  });
}

export function useFlashcardStats() {
  return useQuery({
    queryKey: ['flashcards', 'stats'],
    queryFn: flashcardsApi.getStats,
  });
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient();
  const { incrementCorrect, incrementWrong, setCurrentCardIndex, currentCardIndex, completeSession } = useFlashcardSessionStore();

  return useMutation({
    mutationFn: ({ flashcardId, rating }: { flashcardId: string; rating: number }) =>
      flashcardsApi.reviewFlashcard(flashcardId, rating),
    onSuccess: (response) => {
      const { isCorrect, xpEarned } = response.data;

      if (isCorrect) {
        incrementCorrect();
        toast.success(`Correct! +${xpEarned} XP`);
      } else {
        incrementWrong();
        toast.error('Incorrect. Keep practicing!');
      }

      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: () => {
      toast.error('Failed to submit review');
    },
  });
}

export function useResetFlashcardProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flashcardId?: string) => flashcardsApi.resetProgress(flashcardId),
    onSuccess: (_, flashcardId) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success(flashcardId ? 'Flashcard is ready to practice again' : 'Flashcard progress reset');
    },
    onError: () => {
      toast.error('Failed to reset flashcard progress');
    },
  });
}

export function useFlashcardSession(cards: any[]) {
  const {
    currentCardIndex,
    correctCount,
    wrongCount,
    sessionComplete,
    setCurrentCardIndex,
    completeSession,
    resetSession,
  } = useFlashcardSessionStore();

  const nextCard = useCallback(() => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      completeSession();
    }
  }, [cards.length, completeSession, currentCardIndex, setCurrentCardIndex]);

  const prevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  }, [currentCardIndex, setCurrentCardIndex]);

  const restartSession = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const currentCard = cards[currentCardIndex];
  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;
  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  return {
    currentCard,
    currentCardIndex,
    correctCount,
    wrongCount,
    sessionComplete,
    progress,
    accuracy,
    totalCards: cards.length,
    isFirstCard: currentCardIndex === 0,
    isLastCard: currentCardIndex === cards.length - 1,
    setCurrentCardIndex,
    nextCard,
    prevCard,
    restartSession,
  };
}
