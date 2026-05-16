export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateXpProgress(currentXp: number, level: number): number {
  const xpForCurrentLevel = Math.floor(100 * Math.pow(1.5, level - 1));
  const xpForNextLevel = Math.floor(100 * Math.pow(1.5, level));
  const xpInCurrentLevel = currentXp - (xpForCurrentLevel * (1 - Math.pow(1.5, level - 1))) / (1 - 1.5);
  return ((currentXp % xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
}

export function getDifficultyLabel(difficulty: number): string {
  const labels = ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];
  return labels[difficulty] || 'Unknown';
}

export function getDifficultyColor(difficulty: number): string {
  const colors = [
    '',
    'text-green-600 bg-green-100',
    'text-blue-600 bg-blue-100',
    'text-yellow-600 bg-yellow-100',
    'text-orange-600 bg-orange-100',
    'text-red-600 bg-red-100',
  ];
  return colors[difficulty] || colors[0];
}
