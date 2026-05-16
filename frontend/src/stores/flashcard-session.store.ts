import { create } from 'zustand';

interface FlashcardSessionState {
  currentCardIndex: number;
  correctCount: number;
  wrongCount: number;
  sessionComplete: boolean;
  setCurrentCardIndex: (index: number) => void;
  incrementCorrect: () => void;
  incrementWrong: () => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useFlashcardSessionStore = create<FlashcardSessionState>((set) => ({
  currentCardIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  sessionComplete: false,

  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),

  incrementCorrect: () =>
    set((state) => ({ correctCount: state.correctCount + 1 })),

  incrementWrong: () =>
    set((state) => ({ wrongCount: state.wrongCount + 1 })),

  completeSession: () => set({ sessionComplete: true }),

  resetSession: () =>
    set({
      currentCardIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      sessionComplete: false,
    }),
}));
