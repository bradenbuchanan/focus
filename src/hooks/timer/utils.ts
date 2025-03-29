// src/hooks/timer/utils.ts

// Format a date consistently to prevent timezone issues
export function getFormattedDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Play notification sound
export function playNotificationSound(): void {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch((e) => console.log('Audio play failed:', e));
  } catch (e) {
    console.log('Audio creation failed:', e);
  }
}

// Get timer end time
export function getTimerEndTime(timeRemaining: number): number {
  return Date.now() + timeRemaining * 1000;
}

// Calculate time remaining based on end time
export function calculateTimeRemaining(endTime: number): number {
  return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
}

// Determine if it's time for a long break
export function isLongBreak(currentSession: number, longBreakInterval: number): boolean {
  return currentSession % longBreakInterval === 0;
}