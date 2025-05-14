// src/utils/formatTime.ts
export function formatTimeValue(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
}

export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = format === 'short' ? {
    month: 'short',
    day: 'numeric',
  } : {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toISOString();
}

export function formatCompletionDate(dateString: string): string {
  return formatDate(dateString, 'short');
}

export function formatDueDate(dateString: string): string {
  if (!dateString) return '';
  
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const timeDiff = dueDate.getTime() - today.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  if (daysDiff < 0) return 'Overdue';
  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  
  return formatDate(dateString, 'short');
}