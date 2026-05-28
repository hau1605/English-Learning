'use client';

import { useEffect, useMemo, useState } from 'react';
import { DueFlashcard } from '@/features/flashcards/api/flashcards.api';
import {
  useAllFlashcards,
  useDueFlashcards,
  useFlashcardSession,
  useResetFlashcardProgress,
  useReviewFlashcard,
} from '@/features/flashcards/hooks/use-flashcards.hook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils';

type FlashcardView = 'due' | 'all';

function isReviewed(card?: DueFlashcard) {
  if (!card) return false;
  return Boolean(card.lastReviewedAt || (card.totalReviews && card.totalReviews > 0));
}

function isDue(card?: DueFlashcard) {
  if (!card) return false;
  if (!card.nextReviewAt) return true;
  return new Date(card.nextReviewAt).getTime() <= Date.now();
}

export default function FlashcardsPage() {
  const [activeView, setActiveView] = useState<FlashcardView>('due');
  const [isFlipped, setIsFlipped] = useState(false);
  const { data: dueCards, isLoading: isDueLoading } = useDueFlashcards(20);
  const { data: allCards, isLoading: isAllLoading } = useAllFlashcards();
  const reviewMutation = useReviewFlashcard();
  const resetProgressMutation = useResetFlashcardProgress();

  const dueCardList: DueFlashcard[] = dueCards?.data || [];
  const allCardList: DueFlashcard[] = allCards?.data || [];
  const cards = activeView === 'due' ? dueCardList : allCardList;
  const isLoading = activeView === 'due' ? isDueLoading : isAllLoading;
  const reviewedCards = useMemo(() => allCardList.filter(isReviewed), [allCardList]);

  const {
    currentCard,
    currentCardIndex,
    correctCount,
    wrongCount,
    sessionComplete,
    progress,
    accuracy,
    totalCards,
    setCurrentCardIndex,
    nextCard,
    prevCard,
    restartSession,
  } = useFlashcardSession(cards);

  useEffect(() => {
    setIsFlipped(false);
    restartSession();
  }, [activeView]);

  useEffect(() => {
    if (cards.length === 0) {
      restartSession();
      setIsFlipped(false);
      return;
    }

    if (currentCardIndex >= cards.length) {
      setCurrentCardIndex(0);
    }
  }, [cards.length, currentCardIndex, restartSession, setCurrentCardIndex]);

  const handleRate = async (rating: number) => {
    if (!currentCard) return;

    await reviewMutation.mutateAsync({
      flashcardId: currentCard.flashcardId,
      rating,
    });

    setIsFlipped(false);
    nextCard();
  };

  const handlePracticeAgain = async (card: DueFlashcard) => {
    await resetProgressMutation.mutateAsync(card.flashcardId);
    setActiveView('all');
    restartSession();
    setCurrentCardIndex(Math.max(0, allCardList.findIndex((item) => item.flashcardId === card.flashcardId)));
    setIsFlipped(false);
  };

  const renderFlashcard = (card: DueFlashcard) => (
    <div
      className={`transform-style-3d absolute inset-0 transition-transform duration-500 ${
        isFlipped ? 'rotate-y-180' : ''
      }`}
    >
      <Card className="backface-hidden absolute inset-0 flex flex-col border-blue-500/20 bg-card">
        <CardHeader className="min-h-24">
          <CardTitle className="text-center text-2xl">
            {card.flashcard?.frontContent || card.vocabulary?.word || 'No front content'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center text-center">
          <p className="text-muted-foreground">Click to reveal answer</p>
        </CardContent>
      </Card>

      <Card className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col border-blue-500/30 bg-slate-950/40 dark:bg-slate-950/60">
        <CardHeader className="min-h-24">
          <CardTitle className="text-center text-2xl">
            {card.flashcard?.backContent || card.vocabulary?.meaning || 'No answer content'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          {card.vocabulary?.pronunciation && (
            <p className="text-muted-foreground">/{card.vocabulary.pronunciation}/</p>
          )}
          {card.vocabulary?.example && (
            <p className="text-sm italic">&quot;{card.vocabulary.example}&quot;</p>
          )}
          <div className="flex justify-center gap-2">
            <Badge variant={isDue(card) ? 'default' : 'secondary'}>
              {isDue(card) ? 'Due' : 'Reviewed'}
            </Badge>
            {card.totalReviews ? (
              <Badge variant="outline">{card.totalReviews} reviews</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const handleNavigate = (direction: 'prev' | 'next') => {
    const canMovePrev = direction === 'prev' && currentCardIndex > 0;
    const canMoveNext = direction === 'next' && currentCardIndex < cards.length - 1;

    if (!canMovePrev && !canMoveNext) return;

    setIsFlipped(false);

    if (direction === 'prev') {
      prevCard();
    } else {
      nextCard();
    }
  };

  const handleResetAll = async () => {
    if (!confirm('Reset progress for all flashcards?')) return;

    await resetProgressMutation.mutateAsync(undefined);
    setActiveView('due');
    restartSession();
    setIsFlipped(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <div className="mt-4 flex w-fit overflow-hidden rounded-md border border-border">
            {[
              { value: "due" as const, label: `Due (${dueCardList.length})` },
              {
                value: "all" as const,
                label: `All cards (${allCardList.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveView(tab.value)}
                className={cn(
                  "h-9 px-4 text-sm font-medium transition-colors",
                  activeView === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {totalCards > 0 ? currentCardIndex + 1 : 0} / {totalCards}
          </Badge>
          <Badge variant="outline">
            Correct: {correctCount} | Wrong: {wrongCount}
          </Badge>
          <Button
            variant="outline"
            onClick={handleResetAll}
            disabled={
              resetProgressMutation.isPending || allCardList.length === 0
            }
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset progress
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-xl font-semibold">
              {activeView === "due" ? "No Cards Due!" : "No Flashcards Yet"}
            </h2>
            <p className="text-muted-foreground">
              {activeView === "due"
                ? "Great job! You have reviewed all cards that are due. Switch to All cards if you want extra practice."
                : "No flashcards are available yet."}
            </p>
          </CardContent>
        </Card>
      ) : !currentCard ? (
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="mb-2 text-xl font-semibold">Preparing cards...</h2>
            <p className="text-muted-foreground">
              Your flashcards will be ready in a moment.
            </p>
          </CardContent>
        </Card>
      ) : sessionComplete ? (
        <Card className="mx-auto max-w-md">
          <CardContent className="space-y-4 pt-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{accuracy}%</div>
              <p className="text-muted-foreground">Accuracy</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {correctCount}
                </div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {wrongCount}
                </div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                restartSession();
                setIsFlipped(false);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Progress value={progress} className="mx-auto max-w-md" />

          {/* {isFlipped && ( */}
            <div className="flex flex-wrap justify-center gap-4">
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
                className="w-32 bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleRate(3)}
                disabled={reviewMutation.isPending}
              >
                Easy
              </Button>
            </div>
          {/* )} */}

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              className="h-12 w-12 rounded-full p-0"
              onClick={() => handleNavigate("prev")}
              disabled={currentCardIndex === 0}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div
              className="perspective-1000 relative h-96 w-full max-w-md cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* <div
                className={`transform-style-3d absolute inset-0 transition-transform duration-200 ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              > */}
                {renderFlashcard(currentCard)}
              </div>
            {/* </div> */}

            <Button
              variant="outline"
              className="h-12 w-12 rounded-full p-0"
              onClick={() => handleNavigate("next")}
              disabled={currentCardIndex === cards.length - 1}
              aria-label="Next card"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {activeView === "all" && reviewedCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reviewed cards</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {reviewedCards.map((card) => (
              <div
                key={card.flashcardId}
                className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {card.vocabulary?.word || card.flashcard?.frontContent}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.vocabulary?.meaning || card.flashcard?.backContent}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePracticeAgain(card)}
                  disabled={resetProgressMutation.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Practice again
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
