import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateLevelFromXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = calculateXpForLevel(level);

  while (totalXp >= xpNeeded) {
    level++;
    xpNeeded += calculateXpForLevel(level);
  }

  return level - 1;
}

export function calculateSpacedRepetition(
  rating: number,
  repetitionCount: number,
  easeFactor: number,
  intervalDays: number,
): {
  repetitionCount: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
} {
  let newRepetitionCount = repetitionCount;
  let newEaseFactor = easeFactor;
  let newIntervalDays = intervalDays;

  if (rating < 2) {
    newRepetitionCount = 0;
    newIntervalDays = 1;
  } else {
    if (repetitionCount === 0) {
      newIntervalDays = 1;
    } else if (repetitionCount === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor);
    }
    newRepetitionCount = repetitionCount + 1;
  }

  newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
  );

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays);

  return {
    repetitionCount: newRepetitionCount,
    easeFactor: newEaseFactor,
    intervalDays: newIntervalDays,
    nextReviewAt,
  };
}
