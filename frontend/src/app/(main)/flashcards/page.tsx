'use client';

import { useState } from 'react';
import { flashcardsApi, DueFlashcard } from '@/features/flashcards/api/flashcards.api';
import { useReviewFlashcard, useFlashcardSession, useDueFlashcards } from '@/features/flashcards/hooks/use-flashcards.hook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function FlashcardsPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const { data: dueCards, isLoading } = useDueFlashcards(20);
  const reviewMutation = useReviewFlashcard();

  const cards: DueFlashcard[] = dueCards?.data || [];
  const {
    currentCard,
    currentCardIndex,
    correctCount,
    wrongCount,
    sessionComplete,
    progress,
    accuracy,
    totalCards,
    nextCard,
    prevCard,
    restartSession,
  } = useFlashcardSession(cards);

  const handleRate = async (rating: number) => {
    if (!currentCard) return;

    await reviewMutation.mutateAsync({
      flashcardId: currentCard.flashcardId,
      rating,
    });

    setIsFlipped(false);
    nextCard();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex justify-center">
          <Skeleton className="h-96 w-full max-w-md" />
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="text-xl font-semibold mb-2">No Cards Due!</h2>
            <p className="text-muted-foreground">
              Great job! You have reviewed all your flashcards.
              Come back later for more practice.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Session Complete!</h1>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{accuracy}%</div>
              <p className="text-muted-foreground">Accuracy</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
            </div>
            <Button className="w-full" onClick={restartSession}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {currentCardIndex + 1} / {totalCards}
          </Badge>
          <Badge variant="outline">
            Correct: {correctCount} | Wrong: {wrongCount}
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="max-w-md mx-auto" />

      <div className="flex justify-center">
        <div
          className="relative h-96 w-full max-w-md cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front */}
            <Card className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : ''}`}>
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {currentCard?.flashcard?.frontContent || currentCard?.vocabulary?.word}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Click to reveal answer</p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className={`absolute inset-0 rotate-y-180 backface-hidden ${
                isFlipped ? '' : 'invisible'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-center">
                  {currentCard?.flashcard?.backContent || currentCard?.vocabulary?.meaning}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentCard?.vocabulary?.pronunciation && (
                  <p className="text-center text-muted-foreground">
                    /{currentCard.vocabulary.pronunciation}/
                  </p>
                )}
                {currentCard?.vocabulary?.example && (
                  <p className="text-center text-sm italic">
                    &quot;{currentCard.vocabulary.example}&quot;
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex justify-center gap-4">
          <Button
            variant="destructive"
            size="lg"
            className="w-32"
            onClick={() => handleRate(0)}
            disabled={reviewMutation.isPending}
          >
            <X className="mr-2 h-5 w-5" />
            Again
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-32"
            onClick={() => handleRate(1)}
            disabled={reviewMutation.isPending}
          >
            Hard
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-32"
            onClick={() => handleRate(2)}
            disabled={reviewMutation.isPending}
          >
            <Check className="mr-2 h-5 w-5" />
            Good
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-32 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleRate(3)}
            disabled={reviewMutation.isPending}
          >
            Easy
          </Button>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={prevCard} disabled={currentCardIndex === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={nextCard} disabled={currentCardIndex === cards.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
