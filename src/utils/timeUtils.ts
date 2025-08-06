/**
 * Time-related utility functions
 */

/**
 * Checks if a date string represents a date that is today
 * @param dateString ISO date string to check
 * @returns true if the date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Calculates elapsed milliseconds between a start time and now
 * @param startTimeIso ISO date string for the start time
 * @returns number of milliseconds elapsed
 */
export function calculateElapsedMs(startTimeIso: string): number {
  return new Date().getTime() - new Date(startTimeIso).getTime();
}

/**
 * Ensures a value is an array, or returns an empty array if not
 * @param possibleArray The value to check
 * @returns The array, or an empty array if the input wasn't an array
 */
export function ensureArray<T>(possibleArray: T[] | undefined | null): T[] {
  return Array.isArray(possibleArray) ? possibleArray : [];
}

/**
 * Calculates the week start date and creates an array of the 7 days in that week
 * @param weekOffset Offset from current week (0 = current week, -1 = last week, etc.)
 * @param weekStartsOn Day the week starts on ('sunday' or 'saturday')
 * @returns Array of Date objects for each day of the specified week
 */
export function getWeekDays(weekOffset: number, weekStartsOn: 'sunday' | 'saturday'): Date[] {
  const now = new Date();

  // Calculate the start of the week with offset
  const weekStart = new Date(now);
  const offset = weekStartsOn === 'sunday' ? 1 : 0;
  const diff = (weekStart.getDay() + 7 - offset) % 7;

  weekStart.setDate(weekStart.getDate() - diff + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);

  // Generate the days of the week
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });
}
