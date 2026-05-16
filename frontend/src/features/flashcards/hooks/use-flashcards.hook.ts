'use client';

import { useState } from 'react';
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

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      completeSession();
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const restartSession = () => {
    resetSession();
  };

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
    nextCard,
    prevCard,
    restartSession,
  };
}
