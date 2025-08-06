/**
 * Format milliseconds to HH:MM format
 */
export function formatTimeHHMM(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to HH:MM:SS format
 */
export function formatTimeHHMMSS(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to decimal hours (e.g., 1.5h)
 */
export function formatDecimalHours(ms: number): string {
  return (ms / 3600000).toFixed(2);
}
