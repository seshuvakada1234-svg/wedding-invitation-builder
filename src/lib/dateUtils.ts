/**
 * Formats a date string (YYYY-MM-DD) into an elegant format like "September 24, 2026"
 */
export function formatWeddingDate(dateStr: string | undefined): string {
  if (!dateStr) return "September 24, 2026";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a time string (HH:MM) into an elegant format like "9:00 AM"
 */
export function formatWeddingTime(timeStr: string | undefined): string {
  if (!timeStr) return "9:00 AM";
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * Gets the day of the week for a date string
 */
export function getDayOfWeek(dateStr: string | undefined): string {
  if (!dateStr) return "Saturday";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Saturday";
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch {
    return "Saturday";
  }
}
